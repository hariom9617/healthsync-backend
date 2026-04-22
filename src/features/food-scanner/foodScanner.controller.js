// Mock food database for demonstration
const mockFoodDatabase = [
  {
    name: 'Apple',
    keywords: ['apple', 'red apple', 'green apple', 'fruit'],
    calories: 95,
    carbs: 25,
    protein: 0.5,
    fat: 0.3,
    servingSize: '1 medium (182g)',
  },
  {
    name: 'Banana',
    keywords: ['banana', 'yellow banana', 'fruit'],
    calories: 105,
    carbs: 27,
    protein: 1.3,
    fat: 0.4,
    servingSize: '1 medium (118g)',
  },
  {
    name: 'Chicken Breast',
    keywords: ['chicken', 'chicken breast', 'grilled chicken', 'protein'],
    calories: 165,
    carbs: 0,
    protein: 31,
    fat: 3.6,
    servingSize: '100g (3.5oz)',
  },
  {
    name: 'Brown Rice',
    keywords: ['rice', 'brown rice', 'cooked rice', 'carbs'],
    calories: 216,
    carbs: 45,
    protein: 4.5,
    fat: 1.8,
    servingSize: '1 cup (195g)',
  },
  {
    name: 'Broccoli',
    keywords: ['broccoli', 'vegetable', 'green vegetable'],
    calories: 55,
    carbs: 11,
    protein: 3.7,
    fat: 0.6,
    servingSize: '1 cup (156g)',
  },
  {
    name: 'Greek Yogurt',
    keywords: ['yogurt', 'greek yogurt', 'dairy', 'protein'],
    calories: 100,
    carbs: 6,
    protein: 17,
    fat: 0.7,
    servingSize: '1 container (170g)',
  },
  {
    name: 'Almonds',
    keywords: ['almonds', 'nuts', 'snack'],
    calories: 164,
    carbs: 6,
    protein: 6,
    fat: 14,
    servingSize: '1 ounce (28g)',
  },
  {
    name: 'Salmon',
    keywords: ['salmon', 'fish', 'grilled salmon', 'protein'],
    calories: 208,
    carbs: 0,
    protein: 20,
    fat: 13,
    servingSize: '100g (3.5oz)',
  },
  {
    name: 'Whole Wheat Bread',
    keywords: ['bread', 'whole wheat bread', 'toast', 'carbs'],
    calories: 80,
    carbs: 15,
    protein: 4,
    fat: 1,
    servingSize: '1 slice (28g)',
  },
  {
    name: 'Eggs',
    keywords: ['eggs', 'boiled eggs', 'scrambled eggs', 'protein'],
    calories: 78,
    carbs: 0.6,
    protein: 6.3,
    fat: 5.3,
    servingSize: '1 large (50g)',
  },
]

export const scanFood = async (req, res) => {
  try {
    const { imageName } = req.body

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock food detection logic
    // In a real implementation, this would call an AI vision service
    let detectedFood = null

    // Simple keyword matching for demo
    const foodName = imageName.toLowerCase()

    for (const food of mockFoodDatabase) {
      if (food.keywords.some((keyword) => foodName.includes(keyword))) {
        detectedFood = food
        break
      }
    }

    // If no match found, return a random food for demo
    if (!detectedFood) {
      detectedFood = mockFoodDatabase[Math.floor(Math.random() * mockFoodDatabase.length)]
    }

    // Add some random variation to make it more realistic
    const variation = 0.9 + Math.random() * 0.2 // 90-110% variation
    const nutritionData = {
      foodName: detectedFood.name,
      calories: Math.round(detectedFood.calories * variation),
      carbs: Math.round(detectedFood.carbs * variation * 10) / 10,
      protein: Math.round(detectedFood.protein * variation * 10) / 10,
      fat: Math.round(detectedFood.fat * variation * 10) / 10,
      servingSize: detectedFood.servingSize,
      confidence: Math.round(75 + Math.random() * 20), // 75-95% confidence
      alternatives: mockFoodDatabase
        .filter((f) => f.name !== detectedFood.name)
        .slice(0, 3)
        .map((f) => ({
          name: f.name,
          calories: f.calories,
          confidence: Math.round(60 + Math.random() * 20),
        })),
    }

    res.json({
      success: true,
      data: nutritionData,
      message: 'Food scanned successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to scan food',
    })
  }
}

export const getFoodSuggestions = async (req, res) => {
  try {
    const { query } = req.query

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required',
      })
    }

    const searchQuery = query.toLowerCase()
    const suggestions = mockFoodDatabase
      .filter(
        (food) =>
          food.name.toLowerCase().includes(searchQuery) ||
          food.keywords.some((keyword) => keyword.includes(searchQuery))
      )
      .slice(0, 5)
      .map((food) => ({
        name: food.name,
        calories: food.calories,
        servingSize: food.servingSize,
      }))

    res.json({
      success: true,
      data: suggestions,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get food suggestions',
    })
  }
}
