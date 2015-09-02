length = 0
version = 0
points = {
  rgb: [],
  r: [],
  g: [],
  b: []
}
stream = open('X-Pro II.acv', 'rb') do |io| 
  io.read(4)
  length = io.read(2).unpack('S>')[0]
  puts "Length - #{length}"
  
  length.times do |i|
    points[:rgb] << [io.read(2).unpack('S>')[0], io.read(2).unpack('S>')[0]]
  end
  
  [:r, :g, :b].each do |channel|
    iii = io.read(2).unpack('S>')[0]
    iii.times do |iiiii|
      points[channel] << [io.read(2).unpack('S>')[0], io.read(2).unpack('S>')[0]]
    end
  end
  puts io.read().unpack('S>*').to_s
  
  puts "{rgb: #{points[:rgb].to_a}, r: #{points[:r].to_a}, g: #{points[:g].to_a}, b: #{points[:b].to_a}}"

  # length[0].times do |i|
  #   puts "Curve #{i + 1}"
  #   pt = io.read(2).unpack('S>')
  #   (pt[0] * 4).times do |iiii|
  #     puts io.read(4).unpack('S>S>')
  #   end
  # end
end