const express = require('express');
const router = express.Router();
const supabase = require('../supabase/client');

// POST /api/income - Create a new income record
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('incomes')
      .insert([req.body])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/income - Get all incomes
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('incomes')
      .select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/income/:id - Get income by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('incomes')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// PUT /api/income/:id - Update income by ID
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('incomes')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/income/:id - Delete income by ID
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('incomes')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 