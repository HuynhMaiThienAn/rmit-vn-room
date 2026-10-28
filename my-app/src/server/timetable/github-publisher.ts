import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import type { ShardedTimetableOutput } from './sharding-etl';

const execFileAsync = promisify(execFile);

export interface PublishResult {
  mode: 'local-git' | 'local-fs' | 'github-api' | 'no-op';
  commitSha?: string;
  message: string;
}

/**
 * Compares the newly generated rooms and room-schedule shards against the current
 * public/data files (ignoring the `generatedAt` timestamp in rooms.json).
 * Returns true if the dataset is identical (no-op).
 */
async function isDatasetUnchanged(sharded: ShardedTimetableOutput): Promise<boolean> {
  try {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const existingRoomsRaw = await fs.readFile(path.join(dataDir, 'rooms.json'), 'utf-8');
    if (existingRoomsRaw.trim() !== JSON.stringify(sharded.roomsPayload, null, 2).trim()) {
      return false;
    }

    const schedulesPath = path.join(dataDir, 'schedules.json');
    const existingSchedulesRaw = await fs.readFile(schedulesPath, 'utf-8');
    if (existingSchedulesRaw.trim() !== JSON.stringify(sharded.schedulesPayload, null, 2).trim()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function loadExistingRoomIds(): Promise<Record<string, string>> {
  const roomsPath = path.join(process.cwd(), 'public', 'data', 'rooms.json');
  try {
    const raw = await fs.readFile(roomsPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const map: Record<string, string> = {};
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (Array.isArray(item) && item[0]) {
          map[String(item[0])] = String(item[0]);
        }
      }
    } else if (Array.isArray(parsed?.rooms)) {
      for (const r of parsed.rooms) {
        if (r?.roomName && r?.id) {
          map[String(r.roomName)] = String(r.id);
        }
      }
    }
    return map;
  } catch {
    return {};
  }
}

async function writeShardsToLocalDisk(sharded: ShardedTimetableOutput): Promise<boolean> {
  try {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const schedulesDir = path.join(dataDir, 'schedules');

    await fs.mkdir(dataDir, { recursive: true });

    // Remove legacy directories and files if present
    await fs.rm(path.join(dataDir, 'new_room_sgs.json'), { force: true });
    await fs.rm(path.join(dataDir, 'new_room_hn.json'), { force: true });
    await fs.rm(path.join(dataDir, 'room-index.json'), { force: true });
    await fs.rm(schedulesDir, { recursive: true, force: true });

    // Write readable JSON files with indentation
    await fs.writeFile(
      path.join(dataDir, 'rooms.json'),
      JSON.stringify(sharded.roomsPayload, null, 2),
      'utf-8',
    );

    await fs.writeFile(
      path.join(dataDir, 'schedules.json'),
      JSON.stringify(sharded.schedulesPayload, null, 2),
      'utf-8',
    );

    return true;
  } catch {
    return false;
  }
}

async function autoCommitAndPushLocalGit(sharded: ShardedTimetableOutput): Promise<string | null> {
  try {
    const cwd = process.cwd();
    await execFileAsync('git', ['add', 'public/data'], { cwd });

    try {
      await execFileAsync('git', ['diff', '--cached', '--quiet'], { cwd });
      return 'no-changes';
    } catch {
      // Staged changes exist
    }

    const msg = `chore(data): web sync RMIT timetable (${sharded.totalRooms} rooms, ${sharded.totalDays} days)`;
    await execFileAsync('git', ['commit', '-m', msg], { cwd });
    const { stdout } = await execFileAsync('git', ['rev-parse', '--short', 'HEAD'], { cwd });
    await execFileAsync('git', ['push'], { cwd });
    return stdout.trim();
  } catch {
    return null;
  }
}

async function commitShardsViaGitHubApi(
  sharded: ShardedTimetableOutput,
  token: string,
  repo: string,
  branch: string,
): Promise<string> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${branch}`, {
    headers,
    cache: 'no-store',
  });
  if (!refRes.ok) {
    throw new Error(`GitHub API error reading branch ${branch}: HTTP ${refRes.status}`);
  }
  const refData = (await refRes.json()) as { object: { sha: string } };
  const latestCommitSha = refData.object.sha;

  const commitRes = await fetch(
    `https://api.github.com/repos/${repo}/git/commits/${latestCommitSha}`,
    { headers, cache: 'no-store' },
  );
  if (!commitRes.ok) {
    throw new Error(`GitHub API error reading commit: HTTP ${commitRes.status}`);
  }
  const commitData = (await commitRes.json()) as { tree: { sha: string } };

  const treeItems: Array<{ path: string; mode: '100644'; type: 'blob'; content: string }> = [
    {
      path: 'my-app/public/data/rooms.json',
      mode: '100644',
      type: 'blob',
      content: JSON.stringify(sharded.roomsPayload, null, 2),
    },
    {
      path: 'my-app/public/data/schedules.json',
      mode: '100644',
      type: 'blob',
      content: JSON.stringify(sharded.schedulesPayload, null, 2),
    },
  ];

  let currentBaseTreeSha = commitData.tree.sha;
  const CHUNK_SIZE = 150;
  for (let i = 0; i < treeItems.length; i += CHUNK_SIZE) {
    const chunk = treeItems.slice(i, i + CHUNK_SIZE);
    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: currentBaseTreeSha,
        tree: chunk,
      }),
    });
    if (!treeRes.ok) {
      const errText = await treeRes.text();
      throw new Error(`GitHub API error creating tree: HTTP ${treeRes.status} ${errText}`);
    }
    const treeData = (await treeRes.json()) as { sha: string };
    currentBaseTreeSha = treeData.sha;
  }

  // No-op check at the Git tree level: if the new tree SHA equals the parent commit's tree SHA, skip creating a commit
  if (currentBaseTreeSha === commitData.tree.sha) {
    return 'no-changes';
  }

  const commitMessage = `chore(data): web sync RMIT timetable (${sharded.totalRooms} rooms, ${sharded.totalDays} days)`;
  const newCommitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: commitMessage,
      tree: currentBaseTreeSha,
      parents: [latestCommitSha],
    }),
  });
  if (!newCommitRes.ok) {
    throw new Error(`GitHub API error creating commit: HTTP ${newCommitRes.status}`);
  }
  const newCommitData = (await newCommitRes.json()) as { sha: string };

  const updateRefRes = await fetch(
    `https://api.github.com/repos/${repo}/git/refs/heads/${branch}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: newCommitData.sha }),
    },
  );
  if (!updateRefRes.ok) {
    throw new Error(`GitHub API error updating branch ref: HTTP ${updateRefRes.status}`);
  }

  return newCommitData.sha;
}

export async function publishTimetableShards(
  sharded: ShardedTimetableOutput,
): Promise<PublishResult> {
  // Fast No-Op Diff Check before writing to disk or calling GitHub API
  if (await isDatasetUnchanged(sharded)) {
    return {
      mode: 'no-op',
      message: 'Already up to date (no schedule changes detected).',
    };
  }

  const githubToken = process.env.GITHUB_TOKEN?.trim();
  const githubRepo = process.env.GITHUB_REPO?.trim() || 'HuynhMaiThienAn/rmit-vn-room';
  const githubBranch = process.env.GITHUB_BRANCH?.trim() || 'main';

  const wroteLocal = await writeShardsToLocalDisk(sharded);

  if (githubToken) {
    const commitSha = await commitShardsViaGitHubApi(sharded, githubToken, githubRepo, githubBranch);
    if (commitSha === 'no-changes') {
      return {
        mode: 'no-op',
        message: 'Already up to date (no schedule changes detected).',
      };
    }
    return {
      mode: 'github-api',
      commitSha,
      message: `Committed & pushed to GitHub (${commitSha.slice(0, 7)}) — Vercel deployment triggered!`,
    };
  }

  if (wroteLocal) {
    const localSha = await autoCommitAndPushLocalGit(sharded);
    if (localSha && localSha !== 'no-changes') {
      return {
        mode: 'local-git',
        commitSha: localSha,
        message: `Saved locally, committed (${localSha}), and pushed to GitHub!`,
      };
    }
    return {
      mode: 'local-fs',
      message: 'Updated local schedule files!',
    };
  }

  throw new Error(
    'Cannot persist schedule files: set GITHUB_TOKEN in Vercel environment variables to enable auto-commit on production.',
  );
}
