class VisitorsController < ApplicationController
  
  def acv
    send_file "#{Rails.root}/public/acv_filter/#{params[:filename]}.acv", :type => 'dataview'
  end
  
end
