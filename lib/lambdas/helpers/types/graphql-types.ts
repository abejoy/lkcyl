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

export type Book = {
  __typename?: 'Book';
  bookName: Scalars['String']['output'];
  pages: Scalars['Int']['output'];
};

export type Color = {
  __typename?: 'Color';
  available: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
};

export type ColorInput = {
  available: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addBook?: Maybe<Book>;
  addTeam?: Maybe<Team>;
};


export type MutationAddBookArgs = {
  bookName: Scalars['String']['input'];
  pages: Scalars['Int']['input'];
};


export type MutationAddTeamArgs = {
  captianEmail: Scalars['String']['input'];
  captianName: Scalars['String']['input'];
  managerEmail: Scalars['String']['input'];
  managerName?: InputMaybe<Scalars['String']['input']>;
  players?: InputMaybe<Array<InputMaybe<PlayerInput>>>;
  teamColor: ColorInput;
  teamName: Scalars['String']['input'];
};

export type PlayerInput = {
  name: Scalars['String']['input'];
  verified: Scalars['Boolean']['input'];
};

export type Players = {
  __typename?: 'Players';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  verified: Scalars['Boolean']['output'];
};

export type Query = {
  __typename?: 'Query';
  getAvailableColors?: Maybe<Array<Color>>;
  getBook?: Maybe<Book>;
  getTeam?: Maybe<Team>;
};


export type QueryGetBookArgs = {
  bookName: Scalars['String']['input'];
};


export type QueryGetTeamArgs = {
  teamName: Scalars['String']['input'];
};

export type Team = {
  __typename?: 'Team';
  captianEmail: Scalars['String']['output'];
  captianName: Scalars['String']['output'];
  managerEmail: Scalars['String']['output'];
  managerName: Scalars['String']['output'];
  players?: Maybe<Array<Maybe<Players>>>;
  teamColor: Color;
  teamId: Scalars['String']['output'];
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
  Book: ResolverTypeWrapper<Book>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Color: ResolverTypeWrapper<Color>;
  ColorInput: ColorInput;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  PlayerInput: PlayerInput;
  Players: ResolverTypeWrapper<Players>;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Team: ResolverTypeWrapper<Team>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Book: Book;
  Boolean: Scalars['Boolean']['output'];
  Color: Color;
  ColorInput: ColorInput;
  Int: Scalars['Int']['output'];
  Mutation: {};
  PlayerInput: PlayerInput;
  Players: Players;
  Query: {};
  String: Scalars['String']['output'];
  Team: Team;
};

export type BookResolvers<ContextType = any, ParentType extends ResolversParentTypes['Book'] = ResolversParentTypes['Book']> = {
  bookName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ColorResolvers<ContextType = any, ParentType extends ResolversParentTypes['Color'] = ResolversParentTypes['Color']> = {
  available?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addBook?: Resolver<Maybe<ResolversTypes['Book']>, ParentType, ContextType, RequireFields<MutationAddBookArgs, 'bookName' | 'pages'>>;
  addTeam?: Resolver<Maybe<ResolversTypes['Team']>, ParentType, ContextType, RequireFields<MutationAddTeamArgs, 'captianEmail' | 'captianName' | 'managerEmail' | 'teamColor' | 'teamName'>>;
};

export type PlayersResolvers<ContextType = any, ParentType extends ResolversParentTypes['Players'] = ResolversParentTypes['Players']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  verified?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getAvailableColors?: Resolver<Maybe<Array<ResolversTypes['Color']>>, ParentType, ContextType>;
  getBook?: Resolver<Maybe<ResolversTypes['Book']>, ParentType, ContextType, RequireFields<QueryGetBookArgs, 'bookName'>>;
  getTeam?: Resolver<Maybe<ResolversTypes['Team']>, ParentType, ContextType, RequireFields<QueryGetTeamArgs, 'teamName'>>;
};

export type TeamResolvers<ContextType = any, ParentType extends ResolversParentTypes['Team'] = ResolversParentTypes['Team']> = {
  captianEmail?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  captianName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  managerEmail?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  managerName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  players?: Resolver<Maybe<Array<Maybe<ResolversTypes['Players']>>>, ParentType, ContextType>;
  teamColor?: Resolver<ResolversTypes['Color'], ParentType, ContextType>;
  teamId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  teamName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Book?: BookResolvers<ContextType>;
  Color?: ColorResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Players?: PlayersResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Team?: TeamResolvers<ContextType>;
};

