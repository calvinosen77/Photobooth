class CreatePhotos < ActiveRecord::Migration
  def change
    create_table :photos do |t|
      t.references :user

      t.integer :order

      t.timestamps
    end

    add_attachment :photos, :frame
  end
end
