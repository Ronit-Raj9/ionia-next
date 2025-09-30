# 🔄 Clear Everything and Start Fresh

## **Step 1: Clear Browser Data**

Open your browser console (F12) and run:

```javascript
// Clear all Ionia data from localStorage
localStorage.removeItem('ionia_role');
localStorage.removeItem('ionia_user_info');
localStorage.clear();

// Reload the page
window.location.reload();
```

## **Step 2: Clear Database (Optional but Recommended)**

Visit: `http://localhost:3001/api/cleanup`

Or run this in terminal:
```bash
curl -X POST http://localhost:3001/api/cleanup \
  -H "Content-Type: application/json" \
  -d '{"action": "delete_all_assignments"}'
```

## **Step 3: Register Fresh Users**

1. **Teacher Registration:**
   - Name: Chitarth
   - Email: chitarthkumargupta@gmail.com
   - School ID: CBSE001
   - Role: Teacher

2. **Student Registration:**
   - Name: Ronit (or your student name)
   - Email: ronit@example.com
   - School ID: CBSE001
   - Role: Student

3. **Create a Class** (as Teacher)

4. **Join Class** (as Student)

## **What This Fixes:**

- ✅ Fresh `userId` generated (not `mockUserId`)
- ✅ Clean database without legacy fields
- ✅ Proper name display in UI
- ✅ All relationships use correct IDs

## **Verification:**

After registering, open browser console and check:

```javascript
// Should show userId, not mockUserId
JSON.parse(localStorage.getItem('ionia_user_info'))
```

Expected output:
```json
{
  "userId": "TCH_1727734200_a3f7b2",
  "name": "Chitarth",
  "email": "chitarthkumargupta@gmail.com",
  "role": "teacher",
  "schoolId": "CBSE001"
}
```

**Notice:** No `mockUserId` field!
