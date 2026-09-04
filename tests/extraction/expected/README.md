# Expected output

One file per fixture: `fixture-NNN.expected.json`.

Each records the schema name and version it was written against. A schema change
that invalidates these files must update them in the same commit, or state
plainly which ones it invalidated.

Written by hand, from the document — never generated from a model's output. An
expected file produced by a model encodes that model's habits and stops being a
measurement.
