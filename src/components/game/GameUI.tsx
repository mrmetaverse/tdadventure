import React from 'react';
import PlayerHUD from './PlayerHUD';
import Minimap from './Minimap';
import Chat from './Chat';

const GameUI: React.FC = () => {
  return (
    <div id="ui-container" className="fixed inset-0 pointer-events-none z-40">
      <PlayerHUD />
      <Minimap />
      <Chat />
      
      {/* Instructions overlay */}
      <div className="fixed top-4 left-4 z-50 pointer-events-auto">
        <div className="bg-game-panel border-2 border-game-border rounded-lg p-3 shadow-2xl max-w-xs">
          <div className="text-game-text text-xs space-y-1">
            <div><strong>WASD</strong> - Move</div>
            <div><strong>Mouse</strong> - Look/Attack</div>
            <div><strong>Enter</strong> - Chat</div>
            <div><strong>I</strong> - Inventory</div>
            <div><strong>M</strong> - Map</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameUI;
