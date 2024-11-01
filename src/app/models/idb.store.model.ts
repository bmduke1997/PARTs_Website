import { Banner } from "./api.models";
import { QuestionWithConditions } from "./form.models";
import { Link } from "./navigation.models";
import { Match, ScoutFieldFormResponse, ScoutFieldSchedule, Season, Team, Event, ScoutPitResponse, Schedule, TeamNote, ScheduleType } from "./scouting.models";
import { AuthPermission, User } from "./user.models";

export class LoadedStores {
    Id: number;
    User!: Date;

    constructor() {
        this.Id = 1;
        this.User = new Date();
    }
}

// Define a generic function to generate columns with a constraint
function generateColumns<T extends Record<string, any>>(instance: T): string {
    return (Object.keys(instance) as (keyof T)[]).join(',');
}

const userInstance = new User();
const userPermissionsInstance = new AuthPermission();
const userLinksInstance = new Link('', '');

const seasonInstance = new Season();
const eventInstance = new Event();
const teamInstance = new Team();
const teamNoteInstance = new TeamNote();
const matchInstance = new Match();
const scoutFieldScheduleInstance = new ScoutFieldSchedule();
const questionWithConditionsInstance = new QuestionWithConditions();
const scoutPitResponseInstance = new ScoutPitResponse();
const scheduleTypeInstance = new ScheduleType();
const scheduleInstance = new Schedule();

const loadedStoresInstance = new LoadedStores();

const bannerInstance = new Banner();

export const DBStores = {
    User: {
        TableName: 'User',
        Columns: generateColumns(userInstance),
    },
    UserPermissions: {
        TableName: 'UserPermissions',
        Columns: generateColumns(userPermissionsInstance),
    },
    UserLinks: {
        TableName: 'UserLinks',
        Columns: generateColumns(userLinksInstance),
    },
    Season: {
        TableName: 'Season',
        Columns: generateColumns(seasonInstance),
    },
    Event: {
        TableName: 'Event',
        Columns: generateColumns(eventInstance),
    },
    Team: {
        TableName: 'Team',
        Columns: generateColumns(teamInstance),
    },
    TeamNote: {
        TableName: 'TeamNote',
        Columns: generateColumns(teamNoteInstance),
    },
    Match: {
        TableName: 'Match',
        Columns: generateColumns(matchInstance),
    },
    ScoutFieldSchedule: {
        TableName: 'ScoutFieldSchedule',
        Columns: generateColumns(scoutFieldScheduleInstance),
    },
    ScoutFieldFormResponse: {
        TableName: 'ScoutFieldFormResponse',
        Columns: '++id'//generateColumns(scoutFieldResponseInstance),
    },
    ScoutFieldResponseColumn: {
        TableName: 'ScoutFieldResponseColumn',
        Columns: '++id'//generateColumns(scoutFieldResponseInstance),
    },
    ScoutFieldResponse: {
        TableName: 'ScoutFieldResponse',
        Columns: 'scout_field_id,team_no,rank,match,time,user_id'//generateColumns(scoutFieldResponseInstance),
    },
    ScheduleType: {
        TableName: 'ScheduleType',
        Columns: generateColumns(scheduleTypeInstance),
    },
    Schedule: {
        TableName: 'Schedule',
        Columns: generateColumns(scheduleInstance),
    },
    ScoutPitFormResponse: {
        TableName: 'ScoutPitFormResponse',
        Columns: '++id'//generateColumns(scoutFieldResponseInstance),
    },
    QuestionWithConditions: {
        TableName: 'QuestionWithConditions',
        Columns: generateColumns(questionWithConditionsInstance),
    },
    ScoutPitResponse: {
        TableName: 'ScoutPitResponse',
        Columns: 'team_no,team_nm,scout_pit_id',//generateColumns(scoutPitResponseInstance),
    },
    LoadedStores: {
        TableName: 'LoadedStores',
        Columns: generateColumns(loadedStoresInstance),
    },
    Banner: {
        TableName: 'Banner',
        Columns: generateColumns(bannerInstance),
    },
};