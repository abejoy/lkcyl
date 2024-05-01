import { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AvailableColor = {
  __typename?: 'AvailableColor';
  available: Scalars['Boolean']['output'];
  colorName: Color;
};

export enum Color {
  Black = 'Black',
  Blue = 'Blue',
  Green = 'Green',
  Red = 'Red',
  White = 'White'
}

export enum Gender {
  Female = 'Female',
  Male = 'Male'
}

export type Mutation = {
  __typename?: 'Mutation';
  addTeam?: Maybe<Team>;
};


export type MutationAddTeamArgs = {
  additionalMessage?: InputMaybe<Scalars['String']['input']>;
  captainPhone: Scalars['String']['input'];
  captianEmail: Scalars['String']['input'];
  captianName: Scalars['String']['input'];
  gender: Gender;
  kcylUnit: Scalars['String']['input'];
  managerEmail: Scalars['String']['input'];
  managerName?: InputMaybe<Scalars['String']['input']>;
  managerPhone: Scalars['String']['input'];
  playerNames: Array<InputMaybe<Scalars['String']['input']>>;
  teamColor: Color;
  teamName: Scalars['String']['input'];
};

export type Player = {
  __typename?: 'Player';
  name: Scalars['String']['output'];
  verified: Scalars['Boolean']['output'];
};

export type Query = {
  __typename?: 'Query';
  getAllTeam: Array<Maybe<Team>>;
  getAvailableColors: Array<Maybe<AvailableColor>>;
  getTableData: Array<Maybe<Array<Maybe<Scalars['String']['output']>>>>;
  getTeam?: Maybe<Team>;
  sendEmailsToCaptianManagers: Scalars['String']['output'];
};


export type QueryGetTeamArgs = {
  teamName: Scalars['String']['input'];
};


export type QuerySendEmailsToCaptianManagersArgs = {
  body: Scalars['String']['input'];
  subject: Scalars['String']['input'];
};

export type Team = {
  __typename?: 'Team';
  additionalMessage?: Maybe<Scalars['String']['output']>;
  captainPhone: Scalars['String']['output'];
  captianEmail: Scalars['String']['output'];
  captianName: Scalars['String']['output'];
  gender: Gender;
  kcylUnit: Scalars['String']['output'];
  managerEmail: Scalars['String']['output'];
  managerName: Scalars['String']['output'];
  managerPhone: Scalars['String']['output'];
  players?: Maybe<Array<Maybe<Player>>>;
  teamColor: Color;
  teamName: Scalars['String']['output'];
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AvailableColor: ResolverTypeWrapper<AvailableColor>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Color: Color;
  Gender: Gender;
  Mutation: ResolverTypeWrapper<{}>;
  Player: ResolverTypeWrapper<Player>;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Team: ResolverTypeWrapper<Team>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AvailableColor: AvailableColor;
  Boolean: Scalars['Boolean']['output'];
  Mutation: {};
  Player: Player;
  Query: {};
  String: Scalars['String']['output'];
  Team: Team;
};

export type AvailableColorResolvers<ContextType = any, ParentType extends ResolversParentTypes['AvailableColor'] = ResolversParentTypes['AvailableColor']> = {
  available?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  colorName?: Resolver<ResolversTypes['Color'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addTeam?: Resolver<Maybe<ResolversTypes['Team']>, ParentType, ContextType, RequireFields<MutationAddTeamArgs, 'captainPhone' | 'captianEmail' | 'captianName' | 'gender' | 'kcylUnit' | 'managerEmail' | 'managerPhone' | 'playerNames' | 'teamColor' | 'teamName'>>;
};

export type PlayerResolvers<ContextType = any, ParentType extends ResolversParentTypes['Player'] = ResolversParentTypes['Player']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  verified?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getAllTeam?: Resolver<Array<Maybe<ResolversTypes['Team']>>, ParentType, ContextType>;
  getAvailableColors?: Resolver<Array<Maybe<ResolversTypes['AvailableColor']>>, ParentType, ContextType>;
  getTableData?: Resolver<Array<Maybe<Array<Maybe<ResolversTypes['String']>>>>, ParentType, ContextType>;
  getTeam?: Resolver<Maybe<ResolversTypes['Team']>, ParentType, ContextType, RequireFields<QueryGetTeamArgs, 'teamName'>>;
  sendEmailsToCaptianManagers?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<QuerySendEmailsToCaptianManagersArgs, 'body' | 'subject'>>;
};

export type TeamResolvers<ContextType = any, ParentType extends ResolversParentTypes['Team'] = ResolversParentTypes['Team']> = {
  additionalMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  captainPhone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  captianEmail?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  captianName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  gender?: Resolver<ResolversTypes['Gender'], ParentType, ContextType>;
  kcylUnit?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  managerEmail?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  managerName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  managerPhone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  players?: Resolver<Maybe<Array<Maybe<ResolversTypes['Player']>>>, ParentType, ContextType>;
  teamColor?: Resolver<ResolversTypes['Color'], ParentType, ContextType>;
  teamName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  AvailableColor?: AvailableColorResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Player?: PlayerResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Team?: TeamResolvers<ContextType>;
};

