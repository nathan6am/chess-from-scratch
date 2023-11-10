## Overview

Chess from Scratch is a browser based chess application built from the ground up using TypeScript and Next.js. The goal of this project was to build the application entirely from scratch, without using 3rd party libraries for things like game logic, board/piece interaction, etc. with the aim of deepening my understanding of web development, full-stack architecture, and the game of chess. 

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Features

- Play chess against a friends in realtime or a computer opponent (powered by [Stockfish](https://stockfishchess.org/))
- Realtime chat with your opponent
- Rating system with [glicko-2](https://en.wikipedia.org/wiki/Glicko_rating_system) rating algorithm.
- Study and analyze games, openings, and more using the built in PGN Editor and analysis board.
- Analysis board features include:
    - Fully editable move tree with variations - variations can be added, promoted, and deleted
    - Comment and annotation support with Numeric Annotation Glyphs (NAGs)
    - Highlighting squares and arrows to illustrate ideas and plans
    - Add and Edit metadata such as event, site, date, round, etc.
    - Import and export to standard PGN format
    - Live analysis with [Stockfish](https://stockfishchess.org/)
    - Opening Explorer powered by [Lichess](https://lichess.org/), including filters for rating, time control, and more
    - Set up positions with FEN or the Position Editor
- Solve chess puzzles by rating, theme, and more (powered by [Lichess](https://lichess.org/))
- Create an account to track your game history and stats, save analyses, and more.
- Customize board and piece themes, animations, game behavior, and more.

## Built With

- Next.js and TypeScript: The front-end is powered by [Next.js](https://nextjs.org/) and TypeScript, offering a developer-friendly, type-safe environment. The project uses a custom server built with Express.js and socket.io for realtime capabilities and features

- Tailwind CSS: Modern, responsive UI design with Tailwind CSS.

- PostgreSQL and Redis: PostgreSQL for backend data storage. Realtime games are handles using redis to maximize performance.

- TypeORM: TypeORM is used for database management and migrations.

- Realtime: Realtime capabilities are handled using socket.io.

- Authentication: Authentication is handled using Passport.js and Redis session storage.

- Tanstack React Query: Data fetching and caching is handled using Tanstack's React Query library.

## Roadmap

- [x] Pre-move support in online games
- [x] Live Chat support in online games
- [ ] PGN Export options (include variations, comments, etc.)
- [ ] Tablebase support in analysis board
- [ ] Improved support for mobile devices
- [ ] Variant support (Chess960, Crazyhouse, etc.) in game logic
- [ ] Puzzle filters and rating system
- [ ] Stats and insights for games and puzzles
- [ ] Improved analysis board features (clock annotations, edit comments in place, etc.)
- [ ] Move trainer and repertoire builder