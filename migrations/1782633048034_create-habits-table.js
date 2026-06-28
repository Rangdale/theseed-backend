exports.up = (pgm) => {
  // Create enums first
  pgm.createType('habit_category', [
    'wellness',
    'productivity',
    'fitness',
    'mindfulness',
    'learning',
    'nutrition',
    'social',
    'other'
  ]);

  pgm.createType('habit_difficulty', ['easy', 'medium', 'hard']);

  pgm.createType('habit_frequency', ['daily', 'weekly']);

  pgm.createTable('habits', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    user_id: {
      type: 'varchar(128)',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE'
      // CASCADE: if user is deleted, their habits are deleted too
    },
    title: {
      type: 'varchar(255)',
      notNull: true
    },
    category: {
      type: 'habit_category',
      notNull: true,
      default: 'other'
    },
    difficulty: {
      type: 'habit_difficulty',
      notNull: true,
      default: 'medium'
    },
    frequency: {
      type: 'habit_frequency',
      notNull: true,
      default: 'daily'
    },
    reminder_time: {
      type: 'time',
      notNull: false
      // e.g. "08:00:00" — null means no reminder
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true
      // soft delete — keeps historical completion data intact
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Index for fetching all habits for a user — used on every dashboard load
  pgm.createIndex('habits', 'user_id');

  // Index for filtering active habits
  pgm.createIndex('habits', ['user_id', 'is_active']);
};

exports.down = (pgm) => {
  pgm.dropTable('habits');
  pgm.dropType('habit_frequency');
  pgm.dropType('habit_difficulty');
  pgm.dropType('habit_category');
};