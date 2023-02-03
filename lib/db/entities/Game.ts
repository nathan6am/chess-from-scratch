import { BaseEntity, Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import type { Relation } from "typeorm";
import type { Outcome, Game as GameData } from "@/lib/chess";
import User_Game from "./User_Game";

@Entity()
export default class Game extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column("jsonb", { nullable: true })
  timeControl: { timeSeconds: number; incrementSeconds: number };

  @Column("jsonb")
  outcome: Outcome;

  @Column()
  pgn: string;

  @Column("jsonb")
  data: GameData;

  @OneToMany(() => User_Game, (userGame) => userGame.game)
  players: Relation<User_Game>;
}
