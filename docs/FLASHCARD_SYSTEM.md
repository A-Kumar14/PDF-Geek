# Flashcard System with Spaced Repetition

## Overview

The Flashcard System generates interactive study flashcards from document content with spaced repetition for optimal learning. Cards feature smooth 3D flip animations, progress tracking, and persistent study history using the SM-2 spaced repetition algorithm.

## Features

- **AI-Generated Flashcards**: Creates question-answer pairs from document content
- **3D Flip Animation**: Click-to-flip cards with smooth CSS perspective transforms
- **Spaced Repetition**: SM-2 algorithm schedules reviews based on knowledge level
- **Progress Tracking**: Visual progress bar (remaining/reviewing/known)
- **Persistent State**: Progress syncs to server for logged-in users
- **Knowledge Assessment**: Mark cards as "Review" or "Know It"
- **Auto-Advance**: Automatically move to next card after marking
- **Completion Celebration**: Special message when all cards mastered

## How to Use

### 1. Generate Flashcards

After uploading a document, ask the AI:

```
"Create flashcards about [topic]"
"Generate 10 flashcards on cellular respiration"
"Make flashcards for key terms"
```

**Parameters:**
- `topic`: Subject or section (required)
- `num_cards`: Number of cards (default: 10, max: 20)
- `card_type`: Type of flashcards (definition/concept/fact/mixed)

### 2. Study Flashcards

**Front Side (Question):**
- Shows the question or prompt
- Difficulty badge in top-right corner
- Click anywhere to flip

**Back Side (Answer):**
- Shows the answer or explanation
- Category tags at bottom
- Knowledge assessment buttons appear

### 3. Mark Knowledge Level

After flipping a card, choose:

**[REVIEW]** (Orange)
- "I need more practice with this"
- Resets interval to 1 day
- Card will appear in future study sessions

**[KNOW IT]** (Green)
- "I've mastered this"
- Increases review interval (SM-2 algorithm)
- Card scheduled for future review

### 4. Track Progress

**Progress Bar:**
- Gray: Remaining cards (not yet reviewed)
- Orange: Reviewing cards (need practice)
- Green: Known cards (mastered)

**Status Legend:**
```
⬜ Remaining: X cards
🔶 Reviewing: Y cards
✓ Known: Z cards
```

### 5. Navigation

**Controls:**
- `[<]` Previous card
- `[RESET]` Start over (clears all progress)
- `[>]` Next card

**Auto-Advance:**
- After marking a card, automatically moves to next
- 300ms delay for smooth transition

### 6. Completion

When all cards are marked "Known":
```
✓ ALL CARDS MASTERED!
Great job! You've completed all X flashcards.
```

## Technical Details

### Backend

**Tool Definition:** `generate_flashcards`
- Location: `backend/services/tools.py:101-127`
- Handler: `_generate_flashcards()` (line 269-327)

**Parameters:**
```python
{
  "topic": "string (required)",
  "num_cards": "integer (default: 10, max: 20)",
  "card_type": "enum (definition|concept|fact|mixed)"
}
```

**RAG Integration:**
- Retrieves 8 relevant chunks from ChromaDB
- AI generates cards with front/back/difficulty/tags
- Returns artifact with flashcard data

**Data Model: FlashcardProgress**
- Location: `backend/models.py:141-182`
- Fields:
  * `session_id`, `message_id`, `card_index`
  * `card_front`, `status` (remaining/reviewing/known)
  * SM-2 fields: `ease_factor`, `interval_days`, `next_review_date`
  * `review_count`, `created_at`, `updated_at`
- Unique constraint: (session_id, message_id, card_index)

**API Endpoints:**

POST `/flashcards/progress` - Save card status
```json
{
  "session_id": "abc-123",
  "message_id": 456,
  "card_index": 0,
  "card_front": "What is X?",
  "status": "known"
}
```

GET `/flashcards/progress/:sessionId/:messageId` - Load progress
```json
{
  "progress": [
    {
      "card_index": 0,
      "status": "known",
      "ease_factor": 2.6,
      "interval_days": 3,
      "next_review_date": "2026-02-19T12:00:00Z",
      "review_count": 2
    }
  ]
}
```

### Frontend

**Component:** `FlashcardComponent`
- Location: `frontend/src/components/ArtifactPanel.js:229-574`
- State: `currentIndex`, `flipped`, `cardStatus`

**State Management:**
```typescript
interface FlashcardState {
  currentIndex: number;        // Current card (0-indexed)
  flipped: boolean;            // Front or back showing
  cardStatus: Status[];        // Array of status per card
}

type Status = 'remaining' | 'reviewing' | 'known';
```

**API Integration:**
- `useEffect` loads progress on mount
- `saveProgress()` saves to API on mark
- Graceful degradation for anonymous users (no token)

### Spaced Repetition Algorithm

**SM-2 Algorithm (Simplified):**

Initial state:
- `ease_factor = 2.5`
- `interval_days = 1`

When marked "Known":
- `ease_factor = min(ease_factor + 0.1, 2.5)`
- `interval_days = interval_days * ease_factor`
- `next_review_date = now + interval_days`

When marked "Reviewing":
- `ease_factor` unchanged
- `interval_days = 1`
- `next_review_date = now + 1 day`

When marked "Remaining":
- Reset to initial state

**Future Enhancement:**
Full SM-2 with quality grades (0-5) for finer control.

### Data Format

**Flashcard Artifact Structure:**
```json
{
  "artifact_type": "flashcards",
  "topic": "Photosynthesis",
  "num_cards": 10,
  "card_type": "mixed",
  "message_id": 123,
  "content": [
    {
      "front": "What is photosynthesis?",
      "back": "The process by which plants convert light energy into chemical energy...",
      "difficulty": "medium",
      "tags": ["biology", "plants", "energy"]
    }
  ]
}
```

### 3D Flip Animation

**CSS Transforms:**
```css
.card-container {
  perspective: 1000px;
  transform-style: preserve-3d;
}

.card-front {
  backface-visibility: hidden;
  transform: rotateY(0deg);
}

.card-back {
  backface-visibility: hidden;
  transform: rotateY(180deg);
}

.flipped .card-container {
  transform: rotateY(180deg);
  transition: transform 0.6s;
}
```

**Performance:**
- GPU-accelerated transforms
- Smooth 60fps animation
- No layout reflow

## Best Practices

### For Users

1. **Honest Assessment**: Mark cards accurately (don't mark "Known" if unsure)
2. **Regular Review**: Return daily to review scheduled cards
3. **Reset When Needed**: Use [RESET] to start fresh if needed
4. **Active Recall**: Try to answer before flipping
5. **Read Explanations**: Don't just memorize, understand

### For Developers

1. **Graceful Degradation**: Handle missing token/session gracefully
2. **Optimistic Updates**: Update UI immediately, sync to API async
3. **Error Handling**: Log API errors, don't crash on network issues
4. **Mobile Touch**: Ensure flip works with touch events
5. **Accessibility**: Support keyboard navigation

## Use Cases

### Study Scenarios

**Exam Preparation:**
- Generate 20 flashcards on exam topics
- Study daily leading up to exam
- Review "Reviewing" cards more frequently

**Language Learning:**
- Vocabulary flashcards (word → translation)
- Grammar concepts
- Phrase examples

**Technical Topics:**
- API definitions
- Command syntax
- Code concepts

**Professional Development:**
- Industry terminology
- Best practices
- Process steps

## Future Enhancements

### Planned Features

1. **Review Queue**
   - Show cards due for review (based on next_review_date)
   - Sort by urgency
   - Daily review reminders

2. **Full SM-2 Implementation**
   - 6 quality grades (0-5) instead of 3 states
   - More nuanced scheduling
   - Better long-term retention

3. **Analytics Dashboard**
   - Study streaks
   - Cards mastered over time
   - Topic-wise progress
   - Retention rate graphs

4. **Export/Import**
   - Export to Anki format
   - Import from Quizlet
   - CSV export for backup

5. **Collaboration**
   - Share flashcard sets
   - Study with friends
   - Public flashcard library

6. **Gamification**
   - Daily goals (e.g., "Review 10 cards")
   - Achievements/badges
   - XP points for studying

7. **Mobile App**
   - Native iOS/Android apps
   - Offline support
   - Push notifications for reviews

## Troubleshooting

### Flashcards not generating?

**Problem**: AI doesn't understand
**Solution**: Be explicit - "create flashcards" or "generate flashcards"

### Progress not saving?

**Problem**: Not logged in
**Solution**: Anonymous users can use flashcards but progress won't persist. Sign up/login to save progress.

### Card won't flip?

**Problem**: Click event not registering
**Solution**: Click anywhere on the card (not just text). Ensure JavaScript is enabled.

### Lost progress after refresh?

**Problem**: Network error during save
**Solution**: Check DevTools console. Re-mark cards to trigger save again.

### Can't go back to previous card?

**Problem**: Already at first card
**Solution**: [<] button is disabled at card 0. Use [>] to move forward.

## Examples

### Good Prompts

```
✓ "Create 10 flashcards about World War II"
✓ "Generate definition flashcards for technical terms"
✓ "Make 15 flashcards covering the entire chapter"
✓ "Flashcards for key concepts in machine learning"
```

### Bad Prompts

```
✗ "Cards" (too vague)
✗ "Study aid" (not specific)
✗ "Help me learn" (unclear format)
```

## API Reference

### Frontend API

**Component Props:**
```typescript
interface FlashcardComponentProps {
  data: Flashcard[];
  messageId?: number;
  sessionId?: string;
}

interface Flashcard {
  front: string;        // Question/prompt
  back: string;         // Answer/explanation
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];       // Category tags
}
```

**Component Methods:**
- `handleFlip()`: Toggle card flip
- `handleMarkStatus(status)`: Mark card and save
- `handleNext()`: Navigate to next card
- `handlePrev()`: Navigate to previous card
- `handleReset()`: Clear all progress
- `saveProgress(cardIndex, status)`: Async API call

### Backend API

**Save Progress:**
```http
POST /flashcards/progress
Authorization: Bearer <token>
Content-Type: application/json

{
  "session_id": "abc-123",
  "message_id": 456,
  "card_index": 0,
  "card_front": "What is X?",
  "status": "known"
}
```

**Load Progress:**
```http
GET /flashcards/progress/{sessionId}/{messageId}
Authorization: Bearer <token>

Response: {
  "progress": [...]
}
```

## Performance

**Flashcard Generation Time:**
- RAG retrieval: ~200-500ms
- AI generation: ~3-7s (10 cards)
- Total: ~4-8s

**UI Performance:**
- Flip animation: 60fps (GPU-accelerated)
- Card rendering: Instant
- Progress save: Async (non-blocking)

**Memory Usage:**
- 20 cards: ~50KB in memory
- Progress data: ~2KB per card
- Total overhead: Minimal

## Accessibility

**Keyboard Navigation:**
- Tab to card, Space/Enter to flip
- Arrow keys for prev/next
- 1 for Review, 2 for Know It

**Screen Readers:**
- Front/back announced when flipped
- Progress announced on mark
- Completion message announced

**Color Contrast:**
- Status colors meet WCAG AA
- Text readable on all backgrounds

## Security

**Data Protection:**
- Progress saved per user (JWT auth)
- Session ownership verified
- No PII in flashcard content (AI-generated)

**Anonymous Users:**
- Can use flashcards
- Progress not saved (localStorage only)
- No account required for basic usage

## Testing Checklist

- [ ] Generate flashcards (10 cards)
- [ ] Click to flip (smooth animation)
- [ ] Mark as [REVIEW] (orange)
- [ ] Mark as [KNOW IT] (green)
- [ ] Progress bar updates correctly
- [ ] Navigate with [<] [>]
- [ ] [RESET] clears progress
- [ ] Refresh page, progress persists (logged in)
- [ ] Test as anonymous user (no errors)
- [ ] All cards complete message
- [ ] Test on mobile (touch flip works)
- [ ] Test with 20 cards (max)

---

**Last Updated**: February 16, 2026
**Component Version**: 1.0.0
**Status**: ✅ Production Ready with Persistence
