# BGSI Rebirth Calculator

A static rebirth goal calculator for one, two or three accounts: Account 1, Account 2 and Account 3, with editable names. It follows the visual style of [TrackCCU](https://0szysza.github.io/trackccu/).

Choose one recorded date and time, enter the rebirth counts you had then and your targets, and set how many rebirths you gain over a custom number of minutes. The saved starting point fixes the goal's finish time. Estimated current counts, progress and time left update as time passes, including after reopening the page. Calculations assume a constant pace without breaks. Use Now in the custom calendar when entering a fresh set of counts.

The initial Account 1 and Account 2 values are editable examples. Account 3 starts empty and uses TrackCCU's pink accent. Entered values, account names, the recorded timestamp and the selected number of accounts are saved in localStorage on this device. Older saved inputs are kept and receive a starting timestamp once on their first visit to this version. The Tools menu links to TrackCCU, and the header's back arrow opens the tool hub.

Hover, tap, or focus a progress bar and use the arrow keys to inspect a point. The tooltip shows its rebirth count, progress to 0.1%, estimated time to reach that point, and the goal's finish time. All modes use full-width account cards stacked vertically, with inputs and results side by side on desktop.

Drag across a progress bar in either direction to select a range. Two handles adjust its endpoints; the preview shows their percentages, counts, estimated dates and times, rebirths gained and duration. The Range button initially selects the remaining progress (or the final 10% when the target is already reached). Use arrow keys on a handle for 0.1% adjustments, Shift for 1%, and Escape or the clear button to remove the selection. Each account has its own selection. Range selections last for the current visit and never change the saved counts or recorded timestamp. Earlier points are approximate historical estimates at the entered pace.

Published with GitHub Pages at <https://0szysza.github.io/rebirth/>.
