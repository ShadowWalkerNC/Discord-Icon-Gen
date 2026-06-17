import { db } from './database.js';

export function enqueue(type, payload = {}) {
  db.prepare('INSERT INTO jobs (type, payload) VALUES (?, ?)').run(type, JSON.stringify(payload));
}
