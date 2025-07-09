import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  type: 'income' | 'expense'
  recordId: string
  userId: string
  amount: number
  name: string
  date: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type, recordId, userId, amount, name, date }: EmailRequest = await req.json()

    // Get user profile to check if they're admin
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', userId)
      .single()

    if (profileError) {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`)
    }

    // Get all admin users for notifications
    const { data: adminProfiles, error: adminError } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('role', 'admin')

    if (adminError) {
      throw new Error(`Failed to fetch admin profiles: ${adminError.message}`)
    }

    if (!adminProfiles || adminProfiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No admin users found to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare email content
    const isIncome = type === 'income'
    const subject = `New ${isIncome ? 'Income' : 'Expense'} Added to Workshop Tracker`
    const currencyAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: ${isIncome ? '#10b981' : '#ef4444'}; margin-bottom: 20px;">
            📊 New ${isIncome ? 'Income' : 'Expense'} Added
          </h2>
          
          <div style="background-color: ${isIncome ? '#ecfdf5' : '#fef2f2'}; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${isIncome ? '#10b981' : '#ef4444'};">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">${name}</h3>
            <p style="margin: 5px 0; color: #4b5563;"><strong>Amount:</strong> ${currencyAmount}</p>
            <p style="margin: 5px 0; color: #4b5563;"><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p style="margin: 5px 0; color: #4b5563;"><strong>Added by:</strong> ${userProfile.full_name || userProfile.email}</p>
          </div>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This is an automated notification from your Workshop Tracker application. 
              You're receiving this because you're an administrator.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Dashboard
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
              Kraft Universe Workshop Tracker<br>
              This email was sent automatically when a new ${type} record was created.
            </p>
          </div>
        </div>
      </div>
    `

    // Use Resend API to send emails
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    // Send email to each admin
    const emailPromises = adminProfiles.map(async (admin) => {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Workshop Tracker <notifications@kraftuniverse.com>',
          to: admin.email,
          subject: subject,
          html: emailBody,
        }),
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        throw new Error(`Failed to send email to ${admin.email}: ${errorText}`)
      }

      return emailResponse.json()
    })

    const emailResults = await Promise.allSettled(emailPromises)
    
    // Log results
    const successful = emailResults.filter(result => result.status === 'fulfilled').length
    const failed = emailResults.filter(result => result.status === 'rejected').length

    console.log(`Email notification sent: ${successful} successful, ${failed} failed`)

    // Store notification record in database
    const { error: notificationError } = await supabaseClient
      .from('email_notifications')
      .insert({
        record_type: type,
        record_id: recordId,
        user_id: userId,
        recipients_count: successful,
        failed_count: failed,
        subject: subject,
        sent_at: new Date().toISOString()
      })

    if (notificationError) {
      console.error('Failed to store notification record:', notificationError)
    }

    return new Response(
      JSON.stringify({ 
        message: `Email notifications sent successfully to ${successful} admins`,
        successful,
        failed 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-notification-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 