// Beauville SEZ — Shared reading-reward logic
// Used by novel chapter pages and Official Documents to award Beau Dollar
// for reading, without allowing duplicate claims per user per chapter.
//
// If the visitor isn't logged in, this quietly does nothing except
// navigate onward — reading always works, the reward is a bonus for
// residents who are signed in.

async function claimAndProceed(chapterId, amount, nextUrl) {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session && session.user) {
      // Has this resident already claimed this chapter?
      const { data: existing } = await supabaseClient
        .from('reading_log')
        .select('id')
        .eq('resident_id', session.user.id)
        .eq('chapter_id', chapterId)
        .maybeSingle();

      if (!existing) {
        // Not claimed yet — fetch current balance, add the reward, log it.
        const { data: resident } = await supabaseClient
          .from('residents')
          .select('beau_dollar_balance')
          .eq('id', session.user.id)
          .single();

        if (resident) {
          const newBalance = resident.beau_dollar_balance + amount;

          await supabaseClient
            .from('residents')
            .update({ beau_dollar_balance: newBalance })
            .eq('id', session.user.id);

          await supabaseClient
            .from('reading_log')
            .insert({
              resident_id: session.user.id,
              chapter_id: chapterId,
              earned_amount: amount
            });
        }
      }
    }
  } catch (err) {
    // Never block navigation over a reward-logging hiccup.
    console.error('Beauville reward claim error:', err);
  }

  window.location.href = nextUrl;
}
