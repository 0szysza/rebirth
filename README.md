# BGSI Rebirth Calculator

Track your rebirth grind with saved starting counts, your own pace and a fixed estimated finish time.

**[Open the calculator](https://0szysza.github.io/rebirth/)** · [CCU Tracker](https://0szysza.github.io/trackccu/) · [Tool hub](https://0szysza.github.io/)

## Features

| Feature | What it does |
| --- | --- |
| 1, 2 or 3 accounts | Switch between three modes. Every account keeps its own inputs and occupies a full-width card. |
| Custom account names | Rename Account 1/2/3 with the edit icon; save, cancel or reset to the default name. Reset appears only while editing a custom name. |
| Separate account colors | Cyan, purple and pink make the three accounts easy to distinguish. |
| Starting count and target | Set the rebirth count you had at the recorded time and the goal for each account. |
| Custom rebirth pace | Enter a rebirth amount per any positive number of minutes. Vector step buttons accompany the editable fields. |
| Recorded starting time | A custom calendar and time picker set the date and time when those counts were recorded. The starting point stays saved. |
| Live estimates | Current estimated count, progress, remaining rebirths, time left and an ETA update as time passes. |
| Precise progress inspection | Hover, tap or use arrow keys to inspect a point to **0.1%**, including its count, estimated time and goal finish time. |
| Completed goals | Estimates continue counting after the target while retaining the original goal time. Earlier points show approximate historical estimates. |
| Device-local saving | Account names, values, account mode and starting timestamp survive closing and reopening on the same browser/device. |
| Inline help | Small help controls explain the recorded starting time. |
| Responsive layout | Inputs and results sit side by side on desktop, with stacked sections on smaller screens. |
| Shared navigation | The Tools dropdown opens CCU Tracker; the header arrow opens the tool hub. Social links stay in the footer. |
| Link previews | Static Discord/social metadata and a branded 1200 × 630 cover. |

## How to use it

1. Choose **1 Account**, **2 Accounts** or **3 Accounts**.
2. Set **Counts recorded at** to the time your starting counts were measured. Use **Now** when recording a fresh set.
3. Enter each account’s **Starting rebirths** and **Target rebirths**.
4. Set the pace as **Rebirths per Minutes**.
5. Read the estimated current count and finish time. Inspect any point on its progress bar for more detail.

Rename accounts with the pencil icon. The green check saves, the red X cancels, and the colored reset icon restores the default name.

## Calculation model

For a starting count `C`, target `T`, pace `R` rebirths per `M` minutes and recorded time `S`:

~~~text
Estimated now = C + max(0, elapsed minutes since S) × R / M
Finish time   = S + max(0, T − C) × M / R
Progress      = min(100%, estimated now / T × 100%)
~~~

The clock advances the estimated count rather than moving the recorded starting point. Returning later therefore keeps the original finish time. A target of zero is complete, and a zero pace leaves the count unchanged without inventing a finish time.

These are estimates at a constant pace. The calculator does not read Roblox account data and cannot detect pauses or changes in rebirth speed. Update the starting counts and recorded time when measuring a new pace. Earlier points are extrapolated at the entered pace.

## Saving and privacy

Inputs are stored in the browser’s `localStorage` under `rebirth-calculator:v1`. Calculator values are not submitted to a server. Clearing site storage removes them; another browser/device has separate values. The initial first and second accounts are editable examples, while the third begins empty.

- [CCU Tracker](https://0szysza.github.io/trackccu/) — Roblox games, groups and historical charts.
- [Tool hub](https://0szysza.github.io/) — both tools in one place.

Built by [0szysza](https://github.com/0szysza). Independent fan-made tool; not affiliated with Roblox or Rumble Studios.
