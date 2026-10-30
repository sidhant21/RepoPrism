export default function handler(_req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'RepoPrism Serverless Engine',
    version: '1.0.0',
  });
}
