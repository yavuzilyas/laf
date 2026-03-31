import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock events storage - in a real app, this would be in a database
const events: any[] = [];

export const GET: RequestHandler = async ({ url }) => {
  const targetId = url.searchParams.get('targetId');
  const targetType = url.searchParams.get('targetType');
  
  let filteredEvents = events;
  
  if (targetId && targetType) {
    filteredEvents = events.filter(event => 
      event.targetId === targetId && event.targetType === targetType
    );
  }
  
  return json(filteredEvents);
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const eventData = await request.json();
    
    const newEvent = {
      id: crypto.randomUUID(),
      ...eventData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    events.push(newEvent);
    
    return json({
      success: true,
      event: newEvent
    });
  } catch (error) {
    return json(
      { 
        success: false, 
        error: 'Failed to create event' 
      },
      { status: 500 }
    );
  }
};
