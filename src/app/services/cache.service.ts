import { Injectable } from '@angular/core';
import { DexieCrud } from '../classes/dexie-crud';
import { IEvent, IMatch, ISchedule, IScheduleType, IScoutFieldFormResponse, IScoutFieldSchedule, IScoutPitFormResponse, IScoutPitResponse, ISeason, ITeam, ITeamNote } from '../models/scouting.models';
import { DatabaseService } from './database.service';
import { IAuthPermission, IUser } from '../models/user.models';
import { LoadedStores } from '../models/idb.store.model';
import { IUserLinks } from '../models/navigation.models';
import { IQuestionWithConditions } from '../models/form.models';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  User!: DexieCrud<IUser, number>;
  UserPermissions!: DexieCrud<IAuthPermission, number>;
  UserLinks!: DexieCrud<IUserLinks, number>;

  Season!: DexieCrud<ISeason, number>;
  Event!: DexieCrud<IEvent, number>;
  Team!: DexieCrud<ITeam, number>;
  TeamNote!: DexieCrud<ITeamNote, number>;
  Match!: DexieCrud<IMatch, string>;
  ScoutFieldSchedule!: DexieCrud<IScoutFieldSchedule, number>;
  ScoutFieldFormResponse!: DexieCrud<IScoutFieldFormResponse, number>;
  // These are used for the responses page
  ScoutFieldResponseColumn!: DexieCrud<any, number>;
  ScoutFieldResponse!: DexieCrud<any, number>;

  ScheduleType!: DexieCrud<IScheduleType, string>;
  Schedule!: DexieCrud<ISchedule, number>;

  ScoutPitFormResponse!: DexieCrud<IScoutPitFormResponse, number>;
  ScoutPitResponse!: DexieCrud<IScoutPitResponse, number>;

  QuestionWithConditions!: DexieCrud<IQuestionWithConditions, number>;

  LoadedStores!: DexieCrud<LoadedStores, number>;

  constructor(private dbs: DatabaseService) {
    this.User = new DexieCrud<IUser, number>(this.dbs.UserTable);
    this.UserPermissions = new DexieCrud<IAuthPermission, number>(this.dbs.UserPermissionsTable);
    this.UserLinks = new DexieCrud<IUserLinks, number>(this.dbs.UserLinksTable);

    this.Season = new DexieCrud<ISeason, number>(this.dbs.SeasonTable);
    this.Event = new DexieCrud<IEvent, number>(this.dbs.EventTable);
    this.Team = new DexieCrud<ITeam, number>(this.dbs.TeamTable);
    this.TeamNote = new DexieCrud<ITeamNote, number>(this.dbs.TeamNoteTable);
    this.Match = new DexieCrud<IMatch, string>(this.dbs.MatchTable);
    this.ScoutFieldSchedule = new DexieCrud<IScoutFieldSchedule, number>(this.dbs.ScoutFieldScheduleTable);
    this.ScoutFieldFormResponse = new DexieCrud<IScoutFieldFormResponse, number>(this.dbs.ScoutFieldFormResponseTable);
    this.ScoutFieldResponseColumn = new DexieCrud<any, number>(this.dbs.ScoutFieldResponseColumnTable);
    this.ScoutFieldResponse = new DexieCrud<any, number>(this.dbs.ScoutFieldResponseTable);

    this.ScheduleType = new DexieCrud<IScheduleType, string>(this.dbs.ScheduleTypeTable);
    this.Schedule = new DexieCrud<ISchedule, number>(this.dbs.ScheduleTable);

    this.ScoutPitFormResponse = new DexieCrud<IScoutPitFormResponse, number>(this.dbs.ScoutPitFormResponseTable);
    this.ScoutPitResponse = new DexieCrud<IScoutPitResponse, number>(this.dbs.ScoutPitResponseTable);

    this.QuestionWithConditions = new DexieCrud<IQuestionWithConditions, number>(this.dbs.QuestionWithConditionsTable);

    this.LoadedStores = new DexieCrud<LoadedStores, number>(this.dbs.LoadedStoresTable);
  }
}
