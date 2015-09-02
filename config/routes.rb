Rails.application.routes.draw do
  root to: 'visitors#index'
  devise_for :users
  resources :users
  match '/acv/:filename' => 'visitors#acv', via: :get
end
