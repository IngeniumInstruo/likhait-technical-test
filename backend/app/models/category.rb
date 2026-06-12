class Category < ApplicationRecord
  has_many :expenses, dependent: :destroy

  validates :name, presence: true, uniqueness: true, length: { maximum: 255 }
end
