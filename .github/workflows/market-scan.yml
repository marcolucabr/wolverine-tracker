name: Market Scanner — Wolverine PS5

on:
  schedule:
    # Roda 3x por dia: 8h, 14h e 20h BRT
    - cron: '0 11 * * *'
    - cron: '0 17 * * *'
    - cron: '0 23 * * *'
  workflow_dispatch:

jobs:
  scan:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Roda Market Scanner
        run: node scripts/market-scanner.mjs

