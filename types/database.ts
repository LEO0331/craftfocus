export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      focus_sessions: {
        Row: {
          id: string;
          user_id: string;
          duration_minutes: number;
          category: string;
          build_target: string;
          status: 'completed' | 'given_up';
          reward_coins: number;
          progress_awarded: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          duration_minutes: number;
          category: string;
          build_target: string;
          status: 'completed' | 'given_up';
          reward_coins?: number;
          progress_awarded?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          duration_minutes?: number;
          category?: string;
          build_target?: string;
          status?: 'completed' | 'given_up';
          reward_coins?: number;
          progress_awarded?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      item_catalog: {
        Row: {
          id: string;
          name: string;
          category: string;
          image_url: string | null;
          half_built_image_url: string | null;
          required_progress: number;
        };
        Insert: {
          id: string;
          name: string;
          category: string;
          image_url?: string | null;
          half_built_image_url?: string | null;
          required_progress?: number;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          image_url?: string | null;
          half_built_image_url?: string | null;
          required_progress?: number;
        };
        Relationships: [];
      };
      user_items: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          progress: number;
          unlocked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          progress?: number;
          unlocked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          progress?: number;
          unlocked?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      room_items: {
        Row: {
          id: string;
          room_id: string;
          user_item_id: string;
          x: number;
          y: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_item_id: string;
          x: number;
          y: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_item_id?: string;
          x?: number;
          y?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      craft_posts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          image_url: string | null;
          pixel_image_url: string | null;
          open_to_exchange: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category: string;
          image_url?: string | null;
          pixel_image_url?: string | null;
          open_to_exchange?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          image_url?: string | null;
          pixel_image_url?: string | null;
          open_to_exchange?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          craft_post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          craft_post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          craft_post_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          craft_post_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          craft_post_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          craft_post_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
        };
        Relationships: [];
      };
      exchange_requests: {
        Row: {
          id: string;
          requester_id: string;
          owner_id: string;
          craft_post_id: string;
          message: string | null;
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          owner_id: string;
          craft_post_id: string;
          message?: string | null;
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          owner_id?: string;
          craft_post_id?: string;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
