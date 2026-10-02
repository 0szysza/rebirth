# BGSI Rebirth Calculator

Track your rebirth grind toward a target or across a fixed time interval, with saved starting counts and your own pace.

**[Open the calculator](https://0szysza.github.io/rebirth/)** · [CCU Tracker](https://0szysza.github.io/trackccu/) · [Tool hub](https://0szysza.github.io/)

## Features

| Feature | What it does |
| --- | --- |
| Two calculation modes | Target goal estimates when a count is reached. Time interval estimates the final count and gained rebirths over a chosen duration. |
| 1, 2 or 3 accounts | Choose how many accounts to track. Every account keeps its own inputs and occupies a full-width card. |
| Custom account names | Rename Account 1/2/3 with the edit icon; save, cancel or reset to the default name. Reset appears only while editing a custom name. |
| Separate account colors | Cyan, purple and pink make the three accounts easy to distinguish. |
| Starting count and target | Set the rebirth count you had at the recorded time and the goal for each account. |
| Custom rebirth pace | Enter a rebirth amount per any positive number of minutes. Vector step buttons accompany the editable fields. |
| Custom interval | Choose **For a duration** to enter hours and minutes, or **Until a time** to select an exact end date and time. Set the start with the custom calendar. |
| Recorded starting time | A custom calendar and time picker set the date and time when those counts were recorded. The starting point stays saved. |
| Live estimates | Current estimated count, progress, remaining rebirths, time left and an ETA update as time passes. |
| Precise progress inspection | Hover, tap or use arrow keys to inspect a point to **0.1%**, including its count, estimated time and goal finish time. |
| Completed goals | Estimates continue counting after the target while retaining the original goal time. Earlier points show approximate historical estimates. |
| Device-local saving | Names, account count and the selected calculation mode survive reopening. Each mode keeps separate inputs and a fixed starting timestamp; the duration option, hours/minutes and end time are saved too. |
| Inline help | Small help controls explain the recorded starting time. |
| Responsive layout | Inputs and results sit side by side on desktop, with stacked sections on smaller screens. |
| Shared navigation | The Tools dropdown opens CCU Tracker; the header arrow opens the tool hub. Social links stay in the footer. |
| Link previews | Static Discord/social metadata and a branded 1200 × 630 cover. |

## How to use it

### Target goal

Select **Target goal**.

1. Choose **1 Account**, **2 Accounts** or **3 Accounts**.
2. Set **Counts recorded at** to the time your starting counts were measured. Use **Now** when recording a fresh set.
3. Enter each account’s **Starting rebirths** and **Target rebirths**.
4. Set the pace as **Rebirths per Minutes**.
5. Read the estimated current count and finish time. Inspect any point on its progress bar for more detail.

Rename accounts with the pencil icon. The green check saves, the red X cancels, and the colored reset icon restores the default name.

### Time interval

1. Select **Time interval** and choose how many accounts to track.
2. Enter the starting count and rebirth pace for each account.
3. Set **Interval starts at** with the calendar. Its **Now** button selects the current time when recording fresh counts.
4. In **Duration**, select **For a duration** and enter **Hours** and **Minutes**, or select **Until a time** and choose an **End date and time**. Choose the following date for a finish after midnight.
5. Read **Rebirths at interval end**, **Rebirths gained**, **Estimated now** and **Time left**.

The progress bar measures elapsed time. Inspect a point for the count, gained rebirths and timestamp at that part of the interval. Returning later preserves the end time. A completed interval stops its estimate at the end. Record fresh starting counts and select **Now** in the start calendar to begin again; in **Until a time**, also choose a new end time.

## Calculation model

For a starting count `C`, target `T`, pace `R` rebirths per `M` minutes and recorded time `S`:

~~~text
Estimated now = C + max(0, elapsed minutes since S) × R / M
Finish time   = S + max(0, T − C) × M / R
Progress      = min(100%, estimated now / T × 100%)
~~~

The clock advances the estimated count rather than moving the recorded starting point. Returning later therefore keeps the original finish time. A target of zero is complete, and a zero pace leaves the count unchanged without inventing a finish time.

These are estimates at a constant pace. The calculator does not read Roblox account data and cannot detect pauses or changes in rebirth speed. Update the starting counts and recorded time when measuring a new pace. Earlier points are extrapolated at the entered pace.

For Time interval, with duration `D` in minutes:

~~~text
Rebirths gained = D × R / M
Final count    = C + D × R / M
Interval end   = S + D minutes
Estimated now  = C + clamp(elapsed minutes since S, 0, D) × R / M
Time progress  = clamp(elapsed minutes since S / D, 0, 1) × 100%
~~~

In **Until a time**, `D` is the difference in minutes between the selected end and the recorded start. The end must be after the start. Duration must be positive. A zero rebirth pace still gives a valid interval: the count stays unchanged while the timer advances. The two modes keep independent inputs and starting times in device-local storage.
