# Run

Node 22 or newer and pnpm.

```bash
git clone https://github.com/Rail-L-b/raillab-workbench.git
cd raillab-workbench
pnpm install --frozen-lockfile
pnpm dev            # or: pnpm build && pnpm preview
```

Press **Run**. By default it runs the defective client and the corrected client on the baseline scenario: the defective one tells the user the withdrawal is complete while the anchor is still at `pending_anchor` (a SEP-24 rule), and the corrected one waits for `completed`.
