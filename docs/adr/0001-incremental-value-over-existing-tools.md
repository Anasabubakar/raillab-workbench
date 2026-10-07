# ADR 0001: Why a workbench next to the engine

Status: accepted, 2026-10-07. See the engine's ADR 0001 for the comparison with Stellar Anchor Tests, Anchor Platform and the Wallet SDK (README-level reading only).

The engine is a CLI and library; its value is easiest to see when a developer can watch a client fail on a timeline and read which rule it broke and why. The workbench runs the same engine code in the browser (no scripted outcomes) so a team can explore scenarios and share session files without setup. It does not replace the CLI for testing real client code, and it never executes user code.
