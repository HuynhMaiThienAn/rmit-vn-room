import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.DEBUG_GRAPH_TOKEN; // Temporary: Use a token from Graph Explorer
  
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Connection failed' }, { status: 500 });
  }
}