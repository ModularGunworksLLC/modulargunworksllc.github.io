// Modular Gunworks LLC - Industry-Standard Filters
// Update this file to add or modify filters for each category

const FILTERS = {
  common: [
    { key: 'brand', label: 'Brand', type: 'checkbox' },
    { key: 'price', label: 'Price Range', type: 'range', min: 0, max: 5000, step: 50 },
    { key: 'in_stock', label: 'Availability', type: 'checkbox', options: ['In Stock', 'Out of Stock'] }
  ],
  firearms: [
    { key: 'caliber', label: 'Caliber', type: 'checkbox' },
    { key: 'action', label: 'Action', type: 'checkbox', options: ['Semi-auto', 'Bolt', 'Pump', 'Revolver'] },
    { key: 'barrel_length', label: 'Barrel Length', type: 'range', min: 2, max: 30, step: 0.5 },
    { key: 'capacity', label: 'Capacity', type: 'range', min: 1, max: 100, step: 1 },
    { key: 'finish', label: 'Finish / Color', type: 'checkbox' },
    { key: 'hand', label: 'Hand', type: 'checkbox', options: ['Left', 'Right', 'Ambi'] },
    { key: 'platform', label: 'Platform', type: 'checkbox', options: ['AR-15', 'AR-10', 'AK'] }
  ],
  optics: [
    { key: 'magnification', label: 'Magnification Range', type: 'range', min: 1, max: 25, step: 1 },
    { key: 'objective_size', label: 'Objective Size', type: 'range', min: 10, max: 56, step: 1 },
    { key: 'reticle', label: 'Reticle Type', type: 'checkbox' },
    { key: 'focal_plane', label: 'Focal Plane', type: 'checkbox', options: ['FFP', 'SFP'] },
    { key: 'illumination', label: 'Illumination', type: 'checkbox', options: ['Yes', 'No'] }
  ],
  ammo: [
    { key: 'caliber', label: 'Caliber', type: 'checkbox' },
    { key: 'bullet_weight', label: 'Bullet Weight', type: 'range', min: 20, max: 300, step: 1 },
    { key: 'bullet_type', label: 'Bullet Type', type: 'checkbox', options: ['FMJ', 'HP', 'SP', 'BT'] },
    { key: 'case_material', label: 'Case Material', type: 'checkbox', options: ['Brass', 'Steel', 'Aluminum'] }
  ]
};
