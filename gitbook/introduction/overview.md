# Overview

An interactive incident playground for [RailLab](https://github.com/Rail-L-b/raillab-engine): pick a SEP-24 withdrawal scenario, choose a wallet client, press Run, and see exactly where the client breaks, with every rule labelled as a **SEP-24 requirement** or an **application policy**.

Nothing here is scripted. The scenario server and the reference clients are the real `raillab-engine` code running in your browser; edit the scenario JSON and the outcomes change because the code actually ran again. Everything the anchor does is **simulated**: no real bank, anchor, identifier or payment, and no network access.

Hosted demo: https://raillab-workbench-anasamasama.vercel.app

Source: [raillab-workbench on GitHub](https://github.com/Rail-L-b/raillab-workbench). Releases: [GitHub releases](https://github.com/Rail-L-b/raillab-workbench/releases).
