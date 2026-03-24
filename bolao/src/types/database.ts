export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          avatar_url?: string | null
        }
      }
      leagues: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          season: string
          paid: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id: string
          season?: string
          paid?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          paid?: boolean
        }
      }
      league_members: {
        Row: {
          id: string
          league_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          league_id: string
          user_id: string
          joined_at?: string
        }
        Update: never
      }
      rounds: {
        Row: {
          id: string
          league_id: string
          name: string
          start_date: string
          end_date: string
          status: 'upcoming' | 'open' | 'closed' | 'finished'
          created_at: string
        }
        Insert: {
          id?: string
          league_id: string
          name: string
          start_date: string
          end_date: string
          status?: 'upcoming' | 'open' | 'closed' | 'finished'
          created_at?: string
        }
        Update: {
          status?: 'upcoming' | 'open' | 'closed' | 'finished'
        }
      }
      matches: {
        Row: {
          id: string
          round_id: string
          home_team: string
          away_team: string
          home_score: number | null
          away_score: number | null
          match_date: string
          home_flag: string | null
          away_flag: string | null
        }
        Insert: {
          id?: string
          round_id: string
          home_team: string
          away_team: string
          home_score?: number | null
          away_score?: number | null
          match_date: string
          home_flag?: string | null
          away_flag?: string | null
        }
        Update: {
          home_score?: number | null
          away_score?: number | null
        }
      }
      predictions: {
        Row: {
          id: string
          match_id: string
          user_id: string
          home_score: number
          away_score: number
          points: number | null
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          user_id: string
          home_score: number
          away_score: number
          points?: number | null
          created_at?: string
        }
        Update: {
          home_score?: number
          away_score?: number
          points?: number | null
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type League = Database['public']['Tables']['leagues']['Row']
export type LeagueMember = Database['public']['Tables']['league_members']['Row']
export type Round = Database['public']['Tables']['rounds']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type Prediction = Database['public']['Tables']['predictions']['Row']

export interface LeagueWithMembers extends League {
  members: (LeagueMember & { profile: Profile })[]
}

export interface RoundWithMatches extends Round {
  matches: (Match & { predictions: Prediction[] })[]
}

export interface RankingEntry {
  user_id: string
  name: string
  avatar_url: string | null
  total_points: number
  exact_hits: number
  result_hits: number
  position: number
}
