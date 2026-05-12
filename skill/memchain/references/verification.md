# Verification

`memchain verify --receipt <receipt>` checks:

- artifact hash
- artifact metadata hash
- manifest hash
- commit and parent commit identity
- git bundle contains the receipt commit

`memchain checkout --receipt <receipt> --out <dir>` verifies first, then restores the proven memory tree.

Missing or mismatched proof data fails closed.
