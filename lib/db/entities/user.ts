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
  ILike,
} from "typeorm";
import bcrypt from "bcrypt";
import { defaultSettings } from "../../../context/settings";
import type { Relation } from "typeorm";

import type { Outcome, Game as GameData, Color } from "@/lib/chess";
import type { AppSettings } from "@/context/settings";
import { escapeSpecialChars } from "../../../util/misc";

export type SessionUser = {
  id: string;
  username: string | null;
  type: "user" | "incomplete" | "guest";
};

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true, unique: true })
  username: string;

  @Column({ nullable: true, unique: true })
  facebookId: string;

  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  email: string;

  @OneToMany(() => Notification, (notifcation) => notifcation.user)
  notifications: Relation<Notification[]>;

  @OneToMany(() => User_Game, (userGame) => userGame.user)
  games: Relation<User_Game[]>;

  @OneToMany(() => Analysis, (analysis) => analysis.creator)
  savedAnalyses: Relation<Analysis[]>;

  @Column({ type: "jsonb", default: defaultSettings })
  settings: AppSettings;

  @Column({ default: false })
  profileComplete: boolean;

  @OneToOne(() => Credential, (credential) => credential.id, { cascade: true })
  @JoinColumn()
  credentials: Relation<Credential>;
  static async usernameExists(username: string) {
    const exists = await this.findOne({
      where: {
        username: ILike(`${escapeSpecialChars(username)}`),
      },
    });
    if (exists) return true;
    return false;
  }

  static async login(credentials: {
    email?: string;
    username?: string;
    password: string;
  }): Promise<SessionUser | null> {
    if (!credentials.email && !credentials.username) return null;
    if (credentials.email) {
      const user = await this.findOne({
        where: {
          email: credentials.email,
        },
        relations: {
          credentials: true,
        },
      });
      if (!user || !user.credentials) return null;
      const verified = await bcrypt.compare(credentials.password, user.credentials.hashedPassword);
      if (!verified) return null;
      return {
        username: user.username,
        id: user.id,
        type: user.profileComplete ? "user" : "incomplete",
      };
    }
    if (credentials.username) {
      const user = await this.findOne({
        where: {
          username: ILike(`${escapeSpecialChars(credentials.username)}`),
        },
        relations: {
          credentials: true,
        },
      });
      if (!user || !user.credentials) return null;
      const verified = await bcrypt.compare(credentials.password, user.credentials.hashedPassword);
      if (!verified) return null;
      return {
        username: user.username,
        id: user.id,
        type: user.profileComplete ? "user" : "incomplete",
      };
    }
    return null;
  }

  static async getSessionUser(id: string) {
    const user = await this.findOne({ where: { id } });
    if (!user) return undefined;
    return {
      id: user.id,
      username: user.username,
      type: user.profileComplete ? "user" : "incomplete",
    };
  }

  static async loginWithFacebook(profile: { facebookId: string; name: string }): Promise<SessionUser> {
    const user = await this.findOne({
      where: {
        facebookId: profile.facebookId,
      },
    });
    if (user) {
      const { id, username, profileComplete } = user;
      return { id, username, type: profileComplete ? "user" : "incomplete" };
    }
    const newUser = new User();
    Object.assign(newUser, { facebookId: profile.facebookId, name: profile.name });
    await newUser.save();
    return {
      id: newUser.id,
      username: null,
      type: "incomplete",
    };
  }

  static async createAccountWithCredentials(account: {
    email: string;
    username: string;
    password: string;
  }): Promise<{ created: Partial<User> | null; fieldErrors?: Array<{ field: string; message: string }> }> {
    const { email, username, password } = account;
    const exists = await this.createQueryBuilder("user")
      .where("user.email = :email", { email: account.email })
      .orWhere("LOWER(user.username) = LOWER(:username)", { username: account.username })
      .getExists();
    if (exists) {
      return { created: null, fieldErrors: [{ field: "email", message: "Email address is already in use" }] };
    }
    const user = new User();
    const credentials = new Credential();
    const hash = bcrypt.hashSync(account.password, 10);
    credentials.hashedPassword = hash;
    user.credentials = credentials;
    Object.assign(user, { email, username });
    await user.save();
    if (!user) {
      return { created: null, fieldErrors: [{ field: "none", message: "Unable to create account" }] };
    }
    const created = { id: user.id, username: user.username };
    return { created: created };
  }

  static async updateCredentials(username: string, newPassword: string) {
    const user = await this.findOne({
      where: { username: username },
      relations: { credentials: true },
    });
    if (user) {
      user.credentials.hashedPassword = bcrypt.hashSync(newPassword, 10);
      user.save();
    }
  }
}

@Entity()
export class User_Game {
  @PrimaryColumn()
  user_id: string;

  @PrimaryColumn()
  game_id: string;
  @ManyToOne(() => User, (user) => user.games)
  @JoinColumn({ name: "user_id" })
  user: Relation<User>;

  @ManyToOne(() => Game, (game) => game.players)
  @JoinColumn({ name: "game_id" })
  game: Relation<Game>;

  @Column()
  color: Color;
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
  players: Relation<User_Game>;
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
  user: Relation<User>;
}

@Entity()
export class Analysis {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "json" })
  tree: any;

  @ManyToOne(() => User, (user) => user.savedAnalyses)
  @JoinColumn({ name: "creator_id" })
  creator: Relation<User>;
}

@Entity()
export class Puzzle {
  @PrimaryColumn()
  id: string;
  @Column()
  fen: string;
  @Column("text", { array: true })
  moves: string[];
  @Column()
  rating: number;
  @Column()
  ratingDeviation: number;
  @Column()
  popularity: number;
  @Column()
  nbPlays: number;
  @Column("text", { array: true })
  themes: string[];
  @Column()
  gameUrl: string;
  @Column({ nullable: true })
  openingFamily: string;
  @Column({ nullable: true })
  openingVariation: string;
}

@Entity()
export class CompletedPuzzle {
  @PrimaryColumn()
  user_id: string;
  @PrimaryColumn()
  puzzle_id: string;
  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "user_id" })
  user: Relation<User>;
}

@Entity()
export class Credential {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ nullable: false })
  hashedPassword: string;
}
