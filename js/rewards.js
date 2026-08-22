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

// Same claiming logic, but for standalone pages (like Official Documents)
// that don't navigate anywhere afterward — just updates the button itself
// to reflect success, or prompts sign-in if the visitor isn't logged in.
async function claimOnly(chapterId, amount, buttonEl, labels) {
  buttonEl.disabled = true;

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session || !session.user) {
      buttonEl.textContent = labels.signInPrompt;
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
      return;
    }

    const { data: existing } = await supabaseClient
      .from('reading_log')
      .select('id')
      .eq('resident_id', session.user.id)
      .eq('chapter_id', chapterId)
      .maybeSingle();

    if (existing) {
      buttonEl.textContent = labels.alreadyClaimed;
      return;
    }

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

      buttonEl.textContent = labels.claimed;
    }
  } catch (err) {
    console.error('Beauville reward claim error:', err);
    buttonEl.textContent = labels.error;
    buttonEl.disabled = false;
  }
}
