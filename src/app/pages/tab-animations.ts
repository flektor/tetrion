import { AnimationController, Animation } from "@ionic/angular";

const animationCtrl = new AnimationController();



export const customAnimation = (_: HTMLElement, opts: any): Animation => {
  // create root transition
  const rootTransition = animationCtrl
    .create()
    .duration(opts.duration || 333)
    .easing('cubic-bezier(0.3,0,0.7,1)');

  const enterTransition = animationCtrl.create().addElement(opts.enteringEl);
  const exitTransition = animationCtrl.create().addElement(opts.leavingEl);

  enterTransition.fromTo('opacity', '0', '1');
  exitTransition.fromTo('opacity', '1', '0');

  if (opts.direction === 'forward') {
    enterTransition.fromTo('transform', 'translateY(-1.5%)', 'translateY(0%)');
    exitTransition.fromTo('transform', 'translateY(0%)', 'translateY(1.5%)');
  } else {
    enterTransition.fromTo('transform', 'translateY(1.5%)', 'translateY(0%)');
    exitTransition.fromTo('transform', 'translateY(0%)', 'translateY(-1.5%)');
  }

  rootTransition.addAnimation([enterTransition, exitTransition]);
  return rootTransition;
}