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
          active_animal_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          active_animal_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          active_animal_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      focus_sessions: {
        Row: {
          id: string;
          user_id: string;
          duration_minutes: number;
          category: string | null;
          build_target: string | null;
          mode: Database['public']['Enums']['focus_mode'];
          status: 'completed' | 'given_up';
          reward_coins: number;
          progress_awarded: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          duration_minutes: number;
          category?: string | null;
          build_target?: string | null;
          mode?: Database['public']['Enums']['focus_mode'];
          status: 'completed' | 'given_up';
          reward_coins?: number;
          progress_awarded?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          duration_minutes?: number;
          category?: string | null;
          build_target?: string | null;
          mode?: Database['public']['Enums']['focus_mode'];
          status?: 'completed' | 'given_up';
          reward_coins?: number;
          progress_awarded?: number | null;
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
          room_type: Database['public']['Enums']['room_type'];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          room_type?: Database['public']['Enums']['room_type'];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          room_type?: Database['public']['Enums']['room_type'];
          created_at?: string;
        };
        Relationships: [];
      };
      room_items: {
        Row: { id: string; room_id: string; user_item_id: string; x: number; y: number; created_at: string };
        Insert: { id?: string; room_id: string; user_item_id: string; x: number; y: number; created_at?: string };
        Update: { id?: string; room_id?: string; user_item_id?: string; x?: number; y?: number; created_at?: string };
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
          listing_category: string | null;
          seed_cost: number;
          listing_type: Database['public']['Enums']['listing_type'];
          reward_item_id: string | null;
          is_active: boolean;
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
          listing_category?: string | null;
          seed_cost?: number;
          listing_type?: Database['public']['Enums']['listing_type'];
          reward_item_id?: string | null;
          is_active?: boolean;
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
          listing_category?: string | null;
          seed_cost?: number;
          listing_type?: Database['public']['Enums']['listing_type'];
          reward_item_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      likes: {
        Row: { id: string; user_id: string; craft_post_id: string; created_at: string };
        Insert: { id?: string; user_id: string; craft_post_id: string; created_at?: string };
        Update: { id?: string; user_id?: string; craft_post_id?: string; created_at?: string };
        Relationships: [];
      };
      comments: {
        Row: { id: string; user_id: string; craft_post_id: string; body: string; created_at: string };
        Insert: { id?: string; user_id: string; craft_post_id: string; body: string; created_at?: string };
        Update: { id?: string; user_id?: string; craft_post_id?: string; body?: string; created_at?: string };
        Relationships: [];
      };
      friendships: {
        Row: { id: string; requester_id: string; addressee_id: string; status: 'pending' | 'accepted' | 'rejected'; created_at: string };
        Insert: { id?: string; requester_id: string; addressee_id: string; status: 'pending' | 'accepted' | 'rejected'; created_at?: string };
        Update: { id?: string; requester_id?: string; addressee_id?: string; status?: 'pending' | 'accepted' | 'rejected'; created_at?: string };
        Relationships: [];
      };
      exchange_requests: {
        Row: { id: string; requester_id: string; owner_id: string; craft_post_id: string; message: string | null; status: 'pending' | 'accepted' | 'rejected' | 'cancelled'; created_at: string };
        Insert: { id?: string; requester_id: string; owner_id: string; craft_post_id: string; message?: string | null; status: 'pending' | 'accepted' | 'rejected' | 'cancelled'; created_at?: string };
        Update: { id?: string; requester_id?: string; owner_id?: string; craft_post_id?: string; message?: string | null; status?: 'pending' | 'accepted' | 'rejected' | 'cancelled'; created_at?: string };
        Relationships: [];
      };
      user_wallets: {
        Row: { user_id: string; seeds_balance: number; updated_at: string };
        Insert: { user_id: string; seeds_balance?: number; updated_at?: string };
        Update: { user_id?: string; seeds_balance?: number; updated_at?: string };
        Relationships: [];
      };
      animal_catalog: {
        Row: { id: string; name: string; sprite_key: string; rarity: string; mode_variants: Json; };
        Insert: { id: string; name: string; sprite_key: string; rarity?: string; mode_variants?: Json; };
        Update: { id?: string; name?: string; sprite_key?: string; rarity?: string; mode_variants?: Json; };
        Relationships: [];
      };
      user_animals: {
        Row: { id: string; user_id: string; animal_id: string; unlocked_at: string; is_active: boolean; };
        Insert: { id?: string; user_id: string; animal_id: string; unlocked_at?: string; is_active?: boolean; };
        Update: { id?: string; user_id?: string; animal_id?: string; unlocked_at?: string; is_active?: boolean; };
        Relationships: [];
      };
      user_inventory: {
        Row: { user_id: string; item_id: string; quantity: number; updated_at: string; };
        Insert: { user_id: string; item_id: string; quantity?: number; updated_at?: string; };
        Update: { user_id?: string; item_id?: string; quantity?: number; updated_at?: string; };
        Relationships: [];
      };
      room_placements: {
        Row: { id: string; room_id: string; item_id: string; anchor_id: string; placed_count: number; created_at: string; };
        Insert: { id?: string; room_id: string; item_id: string; anchor_id: string; placed_count?: number; created_at?: string; };
        Update: { id?: string; room_id?: string; item_id?: string; anchor_id?: string; placed_count?: number; created_at?: string; };
        Relationships: [];
      };
      listing_claims: {
        Row: { id: string; user_id: string; listing_id: string; claimed_at: string; };
        Insert: { id?: string; user_id: string; listing_id: string; claimed_at?: string; };
        Update: { id?: string; user_id?: string; listing_id?: string; claimed_at?: string; };
        Relationships: [];
      };
      custom_collectibles: {
        Row: { id: string; user_id: string; listing_id: string; image_url: string | null; pixel_image_url: string | null; created_at: string; };
        Insert: { id?: string; user_id: string; listing_id: string; image_url?: string | null; pixel_image_url?: string | null; created_at?: string; };
        Update: { id?: string; user_id?: string; listing_id?: string; image_url?: string | null; pixel_image_url?: string | null; created_at?: string; };
        Relationships: [];
      };
      custom_gallery_placements: {
        Row: { id: string; user_id: string; listing_id: string; cell_x: number; cell_y: number; created_at: string; updated_at: string; };
        Insert: { id?: string; user_id: string; listing_id: string; cell_x: number; cell_y: number; created_at?: string; updated_at?: string; };
        Update: { id?: string; user_id?: string; listing_id?: string; cell_x?: number; cell_y?: number; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      award_seeds_for_session: {
        Args: { p_duration_minutes: number; p_status: string; p_mode?: Database['public']['Enums']['focus_mode'] };
        Returns: { coins: number; seeds_balance: number }[];
      };
      claim_listing_with_seeds: {
        Args: { p_listing_id: string };
        Returns: { seeds_balance: number; granted_item_id: string | null; listing_type: Database['public']['Enums']['listing_type'] }[];
      };
      claim_official_inventory_item: {
        Args: { p_item_id: string; p_seed_cost?: number };
        Returns: { seeds_balance: number; item_id: string; quantity: number }[];
      };
      upsert_custom_gallery_placement: {
        Args: { p_listing_id: string; p_cell_x: number; p_cell_y: number };
        Returns: undefined;
      };
      remove_custom_gallery_placement: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
      place_inventory_at_anchor: {
        Args: { p_room_id: string; p_item_id: string; p_anchor_id: string };
        Returns: undefined;
      };
      remove_room_placement: {
        Args: { p_room_placement_id: string };
        Returns: undefined;
      };
      set_active_animal: {
        Args: { p_animal_id: string };
        Returns: undefined;
      };
      unlock_animals_for_user: {
        Args: { target_user_id: string };
        Returns: undefined;
      };
      delete_my_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      focus_mode: 'general' | 'crafting' | 'sewing';
      room_type: 'bedroom' | 'gym';
      listing_type: 'catalog' | 'custom';
    };
    CompositeTypes: Record<string, never>;
  };
};

export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
