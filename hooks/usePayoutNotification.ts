import AsyncStorage from "@react-native-async-storage/async-storage";

const SNAPSHOT_KEY = "@aliaffiliate_payout_snapshot";
const NOTIFIED_KEY = "@aliaffiliate_payout_notified";

/** The earliest day of the month when we start checking for payout. */
const PAYOUT_CHECK_DAY = 20;

interface PayoutSnapshot {
  /** Commission value (in USD) that was visible before payout. */
  amount: number;
  /** "YYYY-MM" — the month the commission belongs to (i.e. last month). */
  month: string;
}

/**
 * Persist the "received last month" commission as a payout snapshot.
 *
 * Rules:
 *  - Only saves when `commission > 0`.
 *  - If a non-zero snapshot already exists for the same month, it is kept
 *    (first positive value wins; avoids overwriting with a later, potentially
 *    post-payout value).
 */
export async function savePayoutSnapshot(
  commission: number,
  lastMonthStr: string
): Promise<void> {
  if (commission <= 0) return;
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    if (raw) {
      const existing: PayoutSnapshot = JSON.parse(raw);
      if (existing.month === lastMonthStr && existing.amount > 0) return;
    }
    await AsyncStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify({ amount: commission, month: lastMonthStr } satisfies PayoutSnapshot)
    );
  } catch {}
}

/**
 * Decide whether to show the payout notification, and mark it as shown.
 *
 * Returns the saved commission amount when ALL conditions are met:
 *  1. Today ≥ day 20 of the current month (payout window has opened).
 *  2. A snapshot exists for `lastMonthStr` with amount > 0.
 *  3. `currentLastMonthCommission` is 0 (orders moved to "Completed Settlement").
 *  4. The user has NOT already been notified for `lastMonthStr`.
 *
 * Returns `null` when the notification should not be shown.
 * On success, atomically marks this month as notified so it fires only once.
 */
export async function checkPayoutNotification(
  currentLastMonthCommission: number,
  lastMonthStr: string
): Promise<number | null> {
  try {
    // Condition 1 — payout window
    if (new Date().getDate() < PAYOUT_CHECK_DAY) return null;

    // Condition 3 — commission has cleared
    if (currentLastMonthCommission > 0) return null;

    // Condition 2 — snapshot exists with a positive amount for this month
    const snapshotRaw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    if (!snapshotRaw) return null;
    const snapshot: PayoutSnapshot = JSON.parse(snapshotRaw);
    if (snapshot.month !== lastMonthStr || snapshot.amount <= 0) return null;

    // Condition 4 — not yet notified
    const notified = await AsyncStorage.getItem(NOTIFIED_KEY);
    if (notified === lastMonthStr) return null;

    // Mark notified before returning so concurrent calls can't double-fire
    await AsyncStorage.setItem(NOTIFIED_KEY, lastMonthStr);
    return snapshot.amount;
  } catch {
    return null;
  }
}
