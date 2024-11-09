const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');  



const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');






const PORT = 3000;

const app = express();
const prisma = new PrismaClient();
app.use(cors());

app.use(bodyParser.json());


function authenticateToken(req, res, next) {
 
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
  
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next(); 
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token.' });
  }
}


app.post('/note/:id', authenticateToken, async (req, res) => {
  const noteId = parseInt(req.params.id);
  const userId = req.user.userId; 
  console.log('Request User ID:', userId);

  try {
   
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: { user: true }, 
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    console.log('Note Data:', note); 

    if (note.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: Not owned by user' });
    }

    return res.json(note);
  } catch (error) {
    console.error(error); 
    return res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/notes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; 

    const notes = await prisma.note.findMany({
      where: { userId: userId },
    });

    if (notes.length === 0) {
      return res.status(404).json({ message: 'No notes found for this user.' });
    }

    return res.json({ success: true, notes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'An error occurred while fetching notes.' });
  }
});



app.delete('/note/:id', authenticateToken, async (req, res) => {
  const noteId = parseInt(req.params.id); 
  const { userId } = req.body;

  try {
    
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

   
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    
    if (note.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: Not owned by user' });
    }

    
    await prisma.note.delete({
      where: { id: noteId },
    });

    return res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'An error occurred while deleting the note' });
  }
});




app.get('/user/:id', async (req, res) => {
  const userId = parseInt(req.params.id); 

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error("Detailed error:", error);
    return res.status(500).json({ success: false, error: 'An error occurred while retrieving the user' });
  }
});

// app.post('/user/create', async (req, res) => {
//   const { email, username, password } = req.body; // Extract email, username, and password from the request body

//   try {
//     // Check if a user with the same email or username already exists
//     const existingUser = await prisma.user.findFirst({
//       where: {
//         OR: [
//           { email: email },
//           { username: username }
//         ]
//       }
//     });

//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: 'Username or email already exists',
//       });
//     }

//     // Create a new user
//     const newUser = await prisma.user.create({
//       data: {
//         email: email,
//         username: username,
//         password: password // You'll likely want to hash this before saving, which we'll get into later
//       }
//     });

//     return res.status(201).json({
//       success: true,
//       message: 'User created successfully',
//       user: newUser
//     });
//   } catch (error) {
//     console.error("Error creating user:", error);
//     return res.status(500).json({
//       success: false,
//       message: 'An error occurred while creating the user',
//     });
//   }
// });





app.post('/user/create', async (req, res) => {
  const { email, username, password } = req.body; 

  try {
    // Check if a user with the same email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists',
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with the hashed password
    const newUser = await prisma.user.create({
      data: {
        email: email,
        username: username,
        password: hashedPassword // Save the hashed password
      }
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { id: newUser.id, email: newUser.email, username: newUser.username,password:''}
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating the user',
    });
  }
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;  

  try {
   
    const user = await prisma.user.findUnique({
      where: { username: username } 
    });
    console.log(user);


    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

  
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.json({
      success: true,
      message: 'Login successful',
      token: token, 
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: 'An error occurred during login' });
  }
});





app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
