const Category = require('../models/Category');

// Create
exports.createCategory = async (req, res) => {
    try {
        const { name, description, image, parentCategory, isActive, sortOrder } = req.body;

        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        if (name.length < 2 || name.length > 50) {
            return res.status(400).json({ success: false, message: 'Category name must be between 2 and 50 characters' });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({ name: name.trim() });
        if (existingCategory) {
            return res.status(409).json({ success: false, message: 'Category with this name already exists' });
        }

        // Validate parent category if provided
        if (parentCategory) {
            const parentExists = await Category.findById(parentCategory);
            if (!parentExists) {
                return res.status(400).json({ success: false, message: 'Parent category does not exist' });
            }
        }

        const newCategory = new Category({
            name: name.trim(),
            description: description?.trim(),
            image,
            parentCategory: parentCategory || null,
            isActive: isActive !== undefined ? isActive : true,
            sortOrder: sortOrder || 0
        });

        await newCategory.save();
        res.status(201).json({ success: true, category: newCategory, message: 'Category created successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Category with this name already exists' });
        }
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

// Read all
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Read by ID
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        res.status(200).json({ success: true, category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update
exports.updateCategory = async (req, res) => {
    try {
        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedCategory) return res.status(404).json({ success: false, message: 'Category not found' });
        res.status(200).json({ success: true, category: updatedCategory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete
exports.deleteCategory = async (req, res) => {
    try {
        const deletedCategory = await Category.findByIdAndDelete(req.params.id);
        if (!deletedCategory) return res.status(404).json({ success: false, message: 'Category not found' });
        res.status(200).json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

