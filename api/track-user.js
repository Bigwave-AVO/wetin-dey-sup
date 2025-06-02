let users = new Set();

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { userId } = req.body;
      if (userId) users.add(userId);
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(400).json({ ok: false });
    }
  } else if (req.method === "GET") {
    // Return the current user count
    return res.status(200).json({ count: users.size });
  } else {
    res.status(405).end();
  }
}