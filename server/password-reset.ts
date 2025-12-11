import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// Reset password endpoint (admin only)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = resetPasswordSchema.parse(req.body);

    // Get user from Supabase Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to list users',
        error: listError.message 
      });
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: `User with email ${email} not found` 
      });
    }

    // Update user password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update password',
        error: updateError.message 
      });
    }

    res.json({ 
      success: true, 
      message: 'Password updated successfully',
      email: email
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error',
        errors: error.errors 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

export default router;
