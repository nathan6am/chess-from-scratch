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

import type { Outcome, Game as GameData, Color, Rating, RatingCategory } from "../../chess";
import type { AppSettings } from "@/context/settings";
import { escapeSpecialChars } from "../../../util/misc";
import User_Game from "./User_Game";
import Game from "./Game";
import Puzzle from "./Puzzle";
import Solved_Puzzle from "./Solved_Puzzle";
import Collection from "./Collection";
import Analysis from "./Analysis";
import { updateRatings } from "../../../server/util/glicko";

export type Ratings = Record<RatingCategory, Rating>;

const defaultRatings: Record<RatingCategory, Rating> = {
  bullet: {
    rating: 1500,
    ratingDeviation: 350,
    volatility: 0.06,
    gameCount: 0,
  },
  blitz: {
    rating: 1500,
    ratingDeviation: 350,
    volatility: 0.06,
    gameCount: 0,
  },
  rapid: {
    rating: 1500,
    ratingDeviation: 350,
    volatility: 0.06,
    gameCount: 0,
  },
  classical: {
    rating: 1500,
    ratingDeviation: 350,
    volatility: 0.06,
    gameCount: 0,
  },
  puzzle: {
    rating: 1500,
    ratingDeviation: 350,
    volatility: 0.06,
    gameCount: 0,
  },
  correspondence: {
    rating: 1500,
    ratingDeviation: 350,
    volatility: 0.06,
    gameCount: 0,
  },
};

export type SessionUser = {
  id: string;
  username: string | null;
  type: "user" | "incomplete" | "guest" | "admin" | "unverified";
};

@Entity()
export default class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true, unique: true })
  username: string;

  @Column("jsonb", { default: defaultRatings })
  ratings: Ratings;

  @OneToMany(() => Notification, (notifcation) => notifcation.user)
  notifications: Relation<Notification[]>;

  @OneToMany(() => User_Game, (userGame) => userGame.user, { cascade: true })
  games: Relation<User_Game[]>;

  @OneToMany(() => Solved_Puzzle, (solvedPuzzle) => solvedPuzzle.user, { cascade: true })
  solvedPuzzles: Relation<Solved_Puzzle[]>;

  @OneToMany(() => Collection, (collection) => collection.user)
  collections: Relation<Collection[]>;

  @OneToMany(() => Analysis, (analysis) => analysis.author)
  savedAnalyses: Relation<Analysis[]>;

  @Column({ default: false })
  complete: boolean;

  get type(): "user" | "incomplete" | "unverified" | "admin" {
    if (!this.complete) return "incomplete";
    if (!this.emailVerified) return "unverified";
    return "user";
  }

  @Column({ default: false })
  emailVerified: boolean;

  @OneToOne(() => Profile, (profile) => profile.id, { cascade: true })
  @JoinColumn()
  profile: Relation<Profile>;

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
          credentials: {
            email: credentials.email,
          },
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
        type: user.type,
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
        type: user.type,
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
      type: user.type,
    };
  }

  static async loginWithFacebook(profile: { facebookId: string; name: string }): Promise<SessionUser> {
    const user = await this.findOne({
      relations: {
        credentials: true,
      },
      where: {
        credentials: {
          facebookId: profile.facebookId,
        },
      },
    });
    if (user) {
      const { id, username, type } = user;
      return { id, username, type };
    }
    const newUser = new User();
    const credentials = new Credential();
    credentials.facebookId = profile.facebookId;
    Object.assign(newUser, {
      name: profile.name,
    });
    newUser.credentials = credentials;
    await newUser.save();
    return {
      id: newUser.id,
      username: null,
      type: newUser.type,
    };
  }

  static async createAccountWithCredentials(account: { email: string; username: string; password: string }): Promise<{
    created: Partial<User> | null;
    fieldErrors?: Array<{ field: string; message: string }>;
  }> {
    const { email, username, password } = account;
    const exists = await this.createQueryBuilder("user")
      .leftJoinAndSelect("user.credentials", "credentials")
      .where("credentials.email = :email", { email: account.email })
      .orWhere("LOWER(user.username) = LOWER(:username)", {
        username: account.username,
      })
      .getExists();
    if (exists) {
      return {
        created: null,
        fieldErrors: [{ field: "email", message: "Email address is already in use" }],
      };
    }
    const user = new User();
    const credentials = new Credential();
    const hash = bcrypt.hashSync(password, 10);
    credentials.hashedPassword = hash;
    credentials.email = email;
    user.credentials = credentials;
    Object.assign(user, { username });
    await user.save();
    if (!user) {
      return {
        created: null,
        fieldErrors: [{ field: "none", message: "Unable to create account" }],
      };
    }
    const created = { id: user.id, username: user.username, type: user.type };
    return { created: created };
  }

  static async updateCredentials(userid: string, currentPassword: string, newPassword: string) {
    const user = await this.findOne({
      where: { id: userid },
      relations: { credentials: true },
    });
    if (user && bcrypt.compareSync(currentPassword, user.credentials.hashedPassword)) {
      user.credentials.hashedPassword = bcrypt.hashSync(newPassword, 10);
      await user.save();
      return true;
    }
    return false;
  }
  static async getCollections(id: string): Promise<Collection[]> {
    const user = await this.findOne({
      where: { id: id },
      relations: {
        collections: {
          analyses: {
            collections: true,
          },
        },
      },
    });
    return user?.collections || [];
  }

  static async getProfile(id: string) {
    const user = await this.findOne({
      where: {
        id,
      },
      relations: {
        profile: true,
        games: {
          game: {
            players: {
              user: true,
            },
          },
        },
      },
    });
    return user;
  }

  static async findById(id: string) {
    const user = await this.findOneBy({ id });
    return user;
  }

  static async updateRatings(category: RatingCategory, updates: Array<{ id: string; newRating: Rating }>) {
    updates.forEach(async (update) => {
      const user = await this.findOneBy({ id: update.id });
      if (!user) return;
      user.ratings[category] = update.newRating;
      await user.save();
    });
  }
  static async createProfile(id: string, profileData: Partial<Omit<Profile, "id">>) {
    const user = await this.findOneBy({ id });
    if (!user) throw new Error("User does not exist");
    if (user.type === "user") throw new Error("user already has profile");
    const profile = new Profile();
    Object.assign(profile, profileData);
    user.profile = profile;
    await user.save();
  }
  static async getGames(id: string) {
    const user = await this.findOne({
      where: { id: id },
      relations: {
        games: {
          game: {
            players: {
              user: true,
            },
          },
        },
      },
    });
    const usergames = user?.games || [];
    const result = usergames.map((usergame) => {
      const filteredPlayers = usergame.game.players.map((player) => ({
        username: player.user.username,
        rating: player.rating,
        color: player.color,
      }));
      return {
        ...usergame,
        game: {
          ...usergame.game,
          players: filteredPlayers,
        },
      };
    });
    return result;
  }

  static async solvePuzzle(
    puzzleid: string,
    userid: string,
    result: "solved" | "solved-w-hint" | "failed",
    rated: boolean = true
  ) {
    const solvedPuzzle = new Solved_Puzzle();
    const puzzle = await Puzzle.findOneBy({ id: puzzleid });
    if (!puzzle) throw new Error("Puzzle does not exist");
    solvedPuzzle.puzzle = puzzle;
    const user = await User.findOneBy({ id: userid });
    if (!user) throw new Error("User does not exist");
    solvedPuzzle.user = user;
    solvedPuzzle.result = result;
    solvedPuzzle.date = new Date();
    await solvedPuzzle.save();
    if (rated) {
      const puzzleRating = {
        rating: puzzle.rating,
        ratingDeviation: 50,
        volatility: 0.06,
        gameCount: 1,
      };
      const userRating = user.ratings.puzzle;
      const [newRating] = updateRatings(
        userRating,
        puzzleRating,
        result === "solved" ? 1 : result === "solved-w-hint" ? 0.5 : 0
      );
      user.ratings.puzzle = newRating;
      await user.save();
    }
    return solvedPuzzle;
  }
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
  @Column({ nullable: true })
  hashedPassword: string;

  @Column({ nullable: true, unique: true })
  facebookId: string;

  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true })
  email: string;
}

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ nullable: true })
  bio: string;
  @Column({ nullable: true })
  country: string;
  @Column({ type: "jsonb", default: defaultSettings })
  settings: AppSettings;
}
