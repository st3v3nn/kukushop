#!/usr/bin/env node
// Usage: node server/scripts/ensure_categories.cjs

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const config = require('../config');
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: config.database.url, ssl: config.database.ssl });
  try {
    await pool.connect();
    const categoriesToEnsure = [
      { name: 'Beverages', description: 'Hot & cold drinks', image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80', display_order: 4 },
      { name: 'Snacks', description: 'Light bites and snacks', image_url: 'https://images.unsplash.com/photo-1544025166-5d1d3b8b6f84?auto=format&fit=crop&q=80', display_order: 5 }
    ];

    for (const c of categoriesToEnsure) {
      const { rows } = await pool.query('SELECT id FROM public.menu_categories WHERE name = $1 LIMIT 1', [c.name]);
      if (rows.length === 0) {
        const ins = await pool.query('INSERT INTO public.menu_categories (name, description, image_url, display_order, is_active, created_at, updated_at) VALUES ($1,$2,$3,$4,true, now(), now()) RETURNING id', [c.name, c.description, c.image_url, c.display_order]);
        console.log(`Inserted category ${c.name} id=${ins.rows[0].id}`);
      } else {
        console.log(`Category ${c.name} already exists (id=${rows[0].id}), updating image and order`);
        await pool.query('UPDATE public.menu_categories SET image_url = $1, display_order = $2, updated_at = now() WHERE id = $3', [c.image_url, c.display_order, rows[0].id]);
      }
    }

    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Failed to ensure categories:', err);
    process.exit(1);
  } finally {
    try { await pool.end(); } catch(e){}
  }
})();
