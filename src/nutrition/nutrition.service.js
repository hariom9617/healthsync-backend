import axios from 'axios'
import Nutrition from '../../models/Nutrition.model.js'

const normalizeDate = (date) => {
  const normalized = new Date(date)
  normalized.setUTCHours(0, 0, 0, 0)
  return normalized
}

export const logMeal = async ({
  userId,
  date,
  mealType,
  name,
  calories,
  protein,
  carbs,
  fat,
  fiber,
  sugar,
  sodium,
  servingSize,
  barcode,
  source,
}) => {
  const normalizedDate = normalizeDate(date)

  const nutrition = await Nutrition.findOneAndUpdate(
    { userId, date: normalizedDate },
    {
      $push: {
        meals: {
          mealType,
          name,
          calories: calories || 0,
          protein: protein || 0,
          carbs: carbs || 0,
          fat: fat || 0,
          fiber: fiber || 0,
          sugar: sugar || 0,
          sodium: sodium || 0,
          servingSize,
          barcode,
          source: source || 'manual',
          loggedAt: new Date(),
        },
      },
    },
    { new: true, upsert: true, runValidators: true }
  )

  return nutrition
}

export const getDailyNutrition = async ({ userId, date }) => {
  const normalizedDate = normalizeDate(date)

  const nutrition = await Nutrition.findOne({ userId, date: normalizedDate })
  return nutrition
}

export const getNutritionRange = async ({ userId, from, to }) => {
  const nutrition = await Nutrition.find({
    userId,
    date: { $gte: from, $lte: to },
  }).sort({ date: 1 })

  return nutrition
}

export const updateWaterIntake = async ({ userId, date, waterIntakeMl }) => {
  const normalizedDate = normalizeDate(date)

  const nutrition = await Nutrition.findOneAndUpdate(
    { userId, date: normalizedDate },
    { $set: { waterIntakeMl } },
    { new: true, upsert: true }
  )

  return nutrition
}

export const deleteMeal = async ({ userId, date, mealId }) => {
  const normalizedDate = normalizeDate(date)

  const nutrition = await Nutrition.findOne({ userId, date: normalizedDate })

  if (!nutrition) {
    throw Object.assign(new Error('Nutrition record not found'), { statusCode: 404 })
  }

  nutrition.meals.pull(mealId)
  await nutrition.save()

  return nutrition
}

export const searchFood = async (query) => {
  try {
    const response = await axios.get(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=10&fields=product_name,nutriments,serving_size,code`,
      { timeout: 5000 }
    )

    const results = response.data.products
      .filter((p) => p.product_name)
      .map((p) => ({
        name: p.product_name,
        calories: p.nutriments?.['energy-kcal_100g'] || 0,
        protein: p.nutriments?.proteins_100g || 0,
        carbs: p.nutriments?.carbohydrates_100g || 0,
        fat: p.nutriments?.fat_100g || 0,
        fiber: p.nutriments?.fiber_100g || 0,
        servingSize: p.serving_size || '100g',
        barcode: p.code,
      }))

    return results
  } catch (error) {
    return []
  }
}
