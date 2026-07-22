IMPORTANT: Must never place all logic, UI, and utilities into a single file.
Code must be modular and properly separated using a /components directory (and other relevant folders).

Requirements:

Reusable UI pieces must live in /components

Pages should only compose components, not contain large UI blocks

Business logic must be extracted into /hooks, /services, or /utils

Files should have a single responsibility

If a file exceeds reasonable length or mixes concerns, it must be split

Disallowed:

Monolithic files containing multiple components, logic, and styles

Inline component definitions inside screens when reuse is possible
FOR FRONTEND
