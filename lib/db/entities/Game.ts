import { BaseEntity, Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import type { Relation } from "typeorm";
import {
  type Outcome,
  type Game as GameData,
  type Color,
  type TimeControl,
  type RatingCategory,
  inferRatingCategeory,
} from "../../chess";
import User_Game from "./User_Game";
import User from "./User";
import type { Player } from "@/server/types/lobby";

@Entity()
export default class Game extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column("jsonb", { nullable: true })
  timeControl: TimeControl;

  @Column("jsonb")
  outcome: Outcome;

  @Column({ nullable: true })
  pgn: string;

  @Column("jsonb")
  data: GameData;

  @Column()
  ratingCategory: RatingCategory;

  @OneToMany(() => User_Game, (userGame) => userGame.game, { cascade: true })
  players: Relation<User_Game[]>;

  @Column("jsonb", { nullable: true })
  guestPlayer: { username: string; color: Color };

  @Column({ default: false })
  isCorrespondence: boolean;

  @Column()
  date: Date;

  static async saveGame(
    players: Record<Color, Player>,
    outcome: Outcome,
    data: GameData,
    timeControl: TimeControl | null,
    pgn: string,
    id: string
  ) {
    const game = new Game();
    Object.assign(game, { id, outcome, data, timeControl, pgn });
    game.players = [];
    game.ratingCategory = inferRatingCategeory(timeControl);
    game.date = new Date();
    await game.save();
    Object.entries(players).forEach(async ([color, player]) => {
      if (player.type === "guest") {
        game.guestPlayer = { username: player.username || "", color: color as Color };
      } else {
        const user = await User.findOneBy({ id: player.id });
        if (user) {
          const opponent = players[color === "w" ? "b" : "w"];
          const userGame = new User_Game();
          userGame.user = user;
          userGame.game = game;
          userGame.color = color as Color;
          userGame.ratingCategory = game.ratingCategory;
          if (opponent.id) userGame.opponentId = opponent.id;
          if (opponent.rating) userGame.opponentRating = opponent.rating;
          userGame.result =
            userGame.game.outcome?.result === "d" ? "draw" : userGame.game.outcome?.result === color ? "win" : "loss";
          if (player.rating) userGame.rating = player.rating;
          await userGame.save();
          game.players.push(userGame);
        }
      }
    });
    const final = await game.save();
    return final;
  }
}
