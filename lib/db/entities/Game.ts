import { BaseEntity, Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import type { Relation } from "typeorm";
import type { Outcome, Game as GameData, Color, TimeControl } from "@/lib/chess";
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

  @OneToMany(() => User_Game, (userGame) => userGame.game, { cascade: true })
  players: Relation<User_Game[]>;

  @Column("jsonb", { nullable: true })
  guestPlayer: { username: string; color: Color };

  @Column({ default: false })
  isCorrespondence: boolean;

  static async saveGame(
    players: Record<Color, Player>,
    outcome: Outcome,
    data: GameData,
    timeControl: TimeControl | null,
    id: string
  ) {
    const game = new Game();
    Object.assign(game, { id, outcome, data, timeControl });
    game.players = [];
    await game.save();
    Object.entries(players).forEach(async ([color, player]) => {
      if (player.type === "guest") {
        game.guestPlayer = { username: player.username || "", color: color as Color };
      } else {
        const user = await User.findOneBy({ id: player.id });
        if (user) {
          const userGame = new User_Game();
          userGame.user = user;
          userGame.game = game;
          userGame.color = color as Color;
          userGame.result =
            userGame.game.outcome?.result === "d" ? "draw" : userGame.game.outcome?.result === color ? "win" : "loss";
          if (user.rating) userGame.rating = user.rating;
          console.log(userGame);
          await userGame.save();
          game.players.push(userGame);
        }
      }
    });
    const final = await game.save();
    return final;
  }
}
