import crypto from 'crypto';            
                                                                                                                                                                                           
  export default async function handler(req, res) {                                                                                                                                        
    if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST' });                                                                                                      
                                                                                                                                                                                           
    const hash = (val) => val ? crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex') : null;                                                                         
                                          
    // Suporte ao payload do SendFlow e ao payload da LP                                                                                                                                   
    const isSendFlow = req.body?.event === 'group.updated.members.added';                                                                                                                  
                                                                                                                                                                                           
    let ph = null;                                                                                                                                                                         
    let userAgent = null;                                                                                                                                                                
    let fbp = null;                                                                                                                                                                        
    let fbc = null;                                                                                                                                                                        
    let eventId = null;                                                                                                                                                                    
                                                                                                                                                                                           
    if (isSendFlow) {                                                                                                                                                                    
      const number = req.body?.data?.number?.replace(/\D/g, '');
      ph = hash(number);                                                                                                                                                                   
      eventId = 'member_' + req.body?.id;     
    } else {                                                                                                                                                                               
      ph = hash(req.body?.ph);                                                                                                                                                           
      userAgent = req.body?.userAgent;                                                                                                                                                     
      fbp = req.body?.fbp;                
      fbc = req.body?.fbc;                                                                                                                                                                 
      eventId = req.body?.eventId;                                                                                                                                                         
    }                                         
                                                                                                                                                                                           
    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;                                                                            
    const url = `https://graph.facebook.com/v21.0/${process.env.FB_PIXEL_ID}/events?access_token=${process.env.FB_ACCESS_TOKEN}`;                                                          
                                              
    const payload = {                                                                                                                                                                      
      data: [{                                                                                                                                                                           
        event_name: 'CompleteRegistration',                                                                                                                                                
        event_time: Math.floor(Date.now() / 1000),                                                                                                                                       
        event_id: eventId,                                                                                                                                                                 
        action_source: 'website',                                                                                                                                                        
        event_source_url: req.headers.referer || '',                                                                                                                                       
        user_data: {                          
          client_ip_address: clientIp,                                                                                                                                                     
          client_user_agent: userAgent,                                                                                                                                                    
          fbp, fbc,                                                                                                                                                                        
          ph                                                                                                                                                                               
        }                                                                                                                                                                                  
      }]                                                                                                                                                                                   
    };
                                                                                                                                                                                           
    try {                                                                                                                                                                                
      const response = await fetch(url, {
        method: 'POST',                       
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });                                                                                                                                                                                  
      const result = await response.json();   
      if (!response.ok) return res.status(502).json({ error: 'Facebook rejeitou', detail: result });                                                                                       
      return res.status(200).json(result);                                                                                                                                               
    } catch (e) {                                                                                                                                                                          
      return res.status(500).json({ error: e.message });
    }                                                                                                                                                                                      
  } 
