import {
  BaseEntity,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
  OneToOne,
} from "typeorm";

import type { Outcome, Game as GameData, Color } from "@/lib/chess";
import type { AppSettings } from "@/context/settings";
import { join } from "path";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @PrimaryColumn({ unique: true })
  username: string;

  @Column({ nullable: true, unique: true })
  facebookId: string;

  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true })
  country: string;

  @OneToMany(() => Notification, (notifcation) => notifcation.user)
  notifications: Notification[];

  @OneToMany(() => User_Game, (userGame) => userGame.user)
  games: User_Game[];

  @OneToMany(() => Analysis, (analysis) => analysis.creator)
  savedAnalyses: Analysis[];

  @Column({ nullable: true })
  settings: AppSettings | null;
}

@Entity()
export class Game {
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
  players: User_Game;
}

@Entity()
export class User_Game {
  @ManyToOne(() => User, (user) => user.games)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Game, (game) => game.players)
  @JoinColumn({ name: "game_id" })
  game: Game;

  @Column()
  color: Color;
}

export enum NotificationType {
  REQUEST_ACCEPTED = "request-accepted",
  REQUEST_DECLINED = "request-declined",
  REQUEST_RECIEVED = "request-recieved",
  CHALLENGE_ACCEPTED = "challenge-accepted",
  CHALLENGE_DECLINED = "challenge-declined",
  CHALLENGE_RECIEVED = "challenge-recieved",
  MESSAGE = "message",
  ADMIN_MESSAGE = "admin-message",
  CORRESPONDENCE_MOVE = "correspondence-move",
  CORRESPONDENCE_RESULT = "correspondence-result",
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: false })
  acknowledged: boolean;

  @Column({ type: "enum", enum: NotificationType })
  type: string;

  @Column({ type: "json" })
  data: any;

  @Column()
  message: string;

  @ManyToOne(() => User, (user) => user.notifications)
  user: User;
}

@Entity()
export class Analysis {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "json" })
  tree: any;

  @ManyToOne(() => User, (user) => user.savedAnalyses)
  @JoinColumn({ name: "creator_id" })
  creator: User;
}
